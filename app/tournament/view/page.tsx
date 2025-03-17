'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import TournamentClock from '@/app/components/TournamentClock';
import PlayerManager from '@/app/components/PlayerManager';
import TableManager from '@/app/components/TableManager';
import PayoutCalculator from '@/app/components/PayoutCalculator';
import { Player, Blind, TableConfig, Payout } from '@/app/types';
import supabase from '@/app/utils/supabase';
import { useSearchParams } from 'next/navigation';
import Footer from '@/app/components/Footer';
import Notifications from '@/app/components/Notifications';
import { 
  getTournamentState, 
  getPlayers, 
  getBlindStructure as getStoredBlindStructure, 
  getTournamentById, 
  saveCompleteTournamentState, 
  saveTournamentState, 
  getTables,
  saveBlindStructure as saveStoredBlindStructure
} from '@/app/utils/localStorage';

// Add this new interface for tournaments
interface Tournament {
  id: string;
  name: string;
  startingChips: number;
  buyIn: number;
  entryFee: number;
  maxRebuys: number;
  rebuyAmount: number;
  rebuyChips: number;
  allowAddOns: boolean;
  addOnAmount: number;
  addOnChips: number;
  nextBreak: number;
  breakLength: number;
  created_at?: string;
}

interface TournamentState {
  id: string;
  name: string;
  startingChips: number;
  buyIn: number;
  entryFee: number;
  maxRebuys: number;
  rebuyAmount: number;
  rebuyChips: number;
  allowAddOns: boolean;
  addOnAmount: number;
  addOnChips: number;
  currentLevel: number;
  levelTime: number; // seconds
  isPaused: boolean;
  nextBreak: number;
  breakLength: number; // minutes
  blinds: Blind;
  isBreak: boolean;
  announcements: string[];
  payouts: Payout[];
}

// Player interface as expected by TableManager and PlayerManager components
// interface Player {
//   id: string;
//   name: string;
//   tableNumber: number;
//   seatNumber: number;
//   chips: number;
//   status: 'active' | 'eliminated' | 'final-table';
//   finishPosition?: number;
//   rebuys: number;
//   addOns: number;
// }

// interface TableConfig {
//   id: number;
//   maxSeats: number;
// }

// Add back the blindStructure constant after the getEliminatedPositions function
  // This would typically come from an API or state management
  const blindStructure: Blind[] = [
    { small: 25, big: 50, ante: 0 },
    { small: 50, big: 100, ante: 0 },
    { small: 75, big: 150, ante: 0 },
    { small: 100, big: 200, ante: 25 },
    { small: 150, big: 300, ante: 25 },
    { small: 200, big: 400, ante: 50 },
    { small: 250, big: 500, ante: 50 },
    { small: 300, big: 600, ante: 75 },
    { small: 400, big: 800, ante: 100 },
    { small: 500, big: 1000, ante: 100 },
    { small: 600, big: 1200, ante: 200 },
    { small: 800, big: 1600, ante: 200 },
    { small: 1000, big: 2000, ante: 300 },
    { small: 1500, big: 3000, ante: 400 },
    { small: 2000, big: 4000, ante: 500 },
    { small: 2500, big: 5000, ante: 500 },
    { small: 3000, big: 6000, ante: 1000 },
    { small: 4000, big: 8000, ante: 1000 },
    { small: 5000, big: 10000, ante: 1000 },
    { small: 6000, big: 12000, ante: 2000 },
  ];

// Add a notification type definition
interface TournamentNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
}

/**
 * Generates default tournament payouts based on the number of players and prize pool
 * @param places Number of places to pay
 * @param prizePool Total prize pool amount
 * @returns Array of payout objects with position, percentage, and amount
 */
const generateDefaultPayouts = (
  places: number,
  prizePool: number
): Payout[] => {
  const payouts: Payout[] = [];
  
  // Default payout percentages based on number of places
  let percentages: number[] = [];
  
  if (places === 1) {
    percentages = [100];
  } else if (places === 2) {
    percentages = [65, 35];
  } else if (places === 3) {
    percentages = [50, 30, 20];
  } else if (places <= 5) {
    percentages = [45, 25, 15, 10, 5];
  } else if (places <= 9) {
    percentages = [30, 20, 15, 10, 7, 6, 5, 4, 3];
  } else {
    // For larger tournaments
    percentages = [25, 15, 10, 7.5, 6, 5, 4, 3, 2.5, 2];
    
    // Add small percentages for remaining places
    const remainingPlaces = places - percentages.length;
    const remainingPercentage = 20; // 20% for all remaining places
    const equalShare = remainingPercentage / remainingPlaces;
    
    for (let i = 0; i < remainingPlaces; i++) {
      percentages.push(equalShare);
    }
  }
  
  // Calculate actual payouts
  for (let i = 0; i < places; i++) {
    if (i < percentages.length) {
      const percentage = percentages[i];
      const amount = Math.round((percentage / 100) * prizePool);
      
      payouts.push({
        position: i + 1,
        percentage,
        amount
      });
    }
  }
  
  // Ensure the sum of amounts equals the prize pool
  let totalAllocated = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  
  // Adjust the first place amount to ensure the total matches the prize pool exactly
  if (totalAllocated !== prizePool && payouts.length > 0) {
    payouts[0].amount += prizePool - totalAllocated;
  }
  
  return payouts;
};

export default function TournamentView() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams?.get('id') || 'demo';
  const isDemoTournament = tournamentId === 'demo';
  
  // State variables for tournament data
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tables, setTables] = useState<TableConfig[]>([]);
  const [blindLevels, setBlindLevels] = useState<Blind[]>(blindStructure);
  
  // UI state variables
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('clock');
  const [isEditingBlinds, setIsEditingBlinds] = useState(false);
  const [editableBlinds, setEditableBlinds] = useState<Blind[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Used for mobile view tab selection
  const [mobileTab, setMobileTab] = useState('clock');
  
  // Table configuration
  const [tablesConfig, setTablesConfig] = useState<TableConfig[]>([
    { id: 1, maxSeats: 9 },
    { id: 2, maxSeats: 9 }
  ]);
  
  // Add this state definition after the other state variables
  const [blindStructureState, setBlindStructureState] = useState<Blind[]>([]);
  
  // Add state for notifications
  const [notifications, setNotifications] = useState<TournamentNotification[]>([]);
  
  // Add state for auto-save throttling
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  const AUTO_SAVE_THROTTLE = 5000; // Only save every 5 seconds at most
  
  // Add a debug state
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Setup a demo tournament for demonstration purposes
  const setupDemoTournament = () => {
    // Create a demo tournament with sample data
    const demoTournament: Tournament = {
      id: 'demo',
      name: 'Demo Tournament',
      startingChips: 10000,
      buyIn: 100,
      entryFee: 20,
      maxRebuys: 2,
      rebuyAmount: 100,
      rebuyChips: 5000,
      allowAddOns: true,
      addOnAmount: 100,
      addOnChips: 5000,
      nextBreak: 4,
      breakLength: 15,
      created_at: new Date().toISOString()
    };
    
    const demoTournamentState: TournamentState = {
      ...demoTournament,
      currentLevel: 3,
      levelTime: 900, // 15 minutes in seconds
      isPaused: false,
      blinds: { small: 100, big: 200, ante: 25 },
      isBreak: false,
      announcements: ['Welcome to the Demo Tournament!'],
      payouts: [
        { position: 1, percentage: 50, amount: 500 },
        { position: 2, percentage: 30, amount: 300 },
        { position: 3, percentage: 20, amount: 200 }
      ]
    };
    
    setTournament(demoTournament);
    setTournamentState(demoTournamentState);
    setPayouts(demoTournamentState.payouts);
    
    // Create some demo players
    const demoPlayers = [
      { id: 'p1', name: 'Alice', email: 'alice@example.com', tableNumber: 1, seatNumber: 1, chips: 12500, status: 'active' as const, rebuys: 1, addOns: 0 },
      { id: 'p2', name: 'Bob', email: 'bob@example.com', tableNumber: 1, seatNumber: 3, chips: 8300, status: 'active' as const, rebuys: 0, addOns: 0 },
      { id: 'p3', name: 'Charlie', email: 'charlie@example.com', tableNumber: 1, seatNumber: 5, chips: 18200, status: 'active' as const, rebuys: 1, addOns: 1 },
      { id: 'p4', name: 'David', email: 'david@example.com', tableNumber: 1, seatNumber: 7, chips: 9800, status: 'active' as const, rebuys: 0, addOns: 0 },
      { id: 'p5', name: 'Eve', email: 'eve@example.com', tableNumber: 1, seatNumber: 9, chips: 0, status: 'eliminated' as const, finishPosition: 10, rebuys: 1, addOns: 0 },
      { id: 'p6', name: 'Frank', email: 'frank@example.com', tableNumber: 2, seatNumber: 2, chips: 14500, status: 'active' as const, rebuys: 0, addOns: 0 },
      { id: 'p7', name: 'Grace', email: 'grace@example.com', tableNumber: 2, seatNumber: 4, chips: 7200, status: 'active' as const, rebuys: 2, addOns: 0 },
      { id: 'p8', name: 'Heidi', email: 'heidi@example.com', tableNumber: 2, seatNumber: 6, chips: 11000, status: 'active' as const, rebuys: 0, addOns: 0 },
      { id: 'p9', name: 'Ivan', email: 'ivan@example.com', tableNumber: 2, seatNumber: 8, chips: 0, status: 'eliminated' as const, finishPosition: 9, rebuys: 1, addOns: 0 },
      { id: 'p10', name: 'Judy', email: 'judy@example.com', tableNumber: 2, seatNumber: 1, chips: 0, status: 'eliminated' as const, finishPosition: 8, rebuys: 1, addOns: 1 }
    ];
    
    setPlayers(demoPlayers);
    
    // Create demo blind structure
    const demoBlindStructure = blindStructure.map(level => ({
      ...level,
      duration: 20
    }));
    
    setBlindLevels(demoBlindStructure);
    setEditableBlinds(demoBlindStructure);
    
    // Demo tables
    setTables([
      { id: 1, maxSeats: 9 },
      { id: 2, maxSeats: 9 }
    ]);
    
    setIsLoading(false);
  };

  // Fetch tournament data
  useEffect(() => {
    const fetchTournament = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Handle demo tournament
        if (isDemoTournament) {
          // Setup a demo tournament
          setupDemoTournament();
          return;
        }
        
        console.log('Loading tournament data for ID:', tournamentId);
        
        // First try to get the tournament state from localStorage (for more complete data)
        const savedState = getTournamentState(tournamentId);
        
        if (savedState) {
          console.log('Loaded tournament state from localStorage:', savedState);
          // Set all the necessary states from the saved state
          setTournamentState(savedState);
          setTournament({
            id: savedState.id,
            name: savedState.name,
            startingChips: savedState.startingChips,
            buyIn: savedState.buyIn,
            entryFee: savedState.entryFee,
            maxRebuys: savedState.maxRebuys,
            rebuyAmount: savedState.rebuyAmount,
            rebuyChips: savedState.rebuyChips,
            allowAddOns: savedState.allowAddOns,
            addOnAmount: savedState.addOnAmount,
            addOnChips: savedState.addOnChips,
            nextBreak: savedState.nextBreak,
            breakLength: savedState.breakLength,
            created_at: savedState.created_at
          });
          
          // If the state didn't include players or blinds, get them separately
          if (!savedState.players) {
            const savedPlayers = getPlayers(tournamentId);
            if (savedPlayers && savedPlayers.length > 0) {
              console.log('Loaded players from localStorage:', savedPlayers.length, 'players');
              setPlayers(savedPlayers);
            }
          } else {
            console.log('Players found in state:', savedState.players.length, 'players');
            setPlayers(savedState.players);
          }
          
          // Load blind structure if available
          const savedBlinds = getStoredBlindStructure(tournamentId);
          if (savedBlinds && savedBlinds.length > 0) {
            console.log('Loaded blind structure from localStorage:', savedBlinds.length, 'levels');
            setBlindLevels(savedBlinds);
            setEditableBlinds(savedBlinds);
          }
          
          // Load tables if available
          const savedTables = getTables(tournamentId);
          if (savedTables && savedTables.length > 0) {
            console.log('Loaded tables from localStorage:', savedTables.length, 'tables');
            setTables(savedTables);
          }
          
          // Set payouts if available
          if (savedState.payouts && savedState.payouts.length > 0) {
            console.log('Loaded payouts from state:', savedState.payouts.length, 'positions');
            setPayouts(savedState.payouts);
          }
        } 
        else {
          // If no state found, try to get just the tournament details
          const tournamentData = getTournamentById(tournamentId);
          
          if (tournamentData) {
            console.log('Loaded tournament from localStorage:', tournamentData);
            setTournament(tournamentData);
            
            // Initialize a basic state
            const initialState: TournamentState = {
              ...tournamentData,
              currentLevel: 1,
              levelTime: 20 * 60, // Default 20 minutes
              isPaused: true,
              blinds: blindStructure[0],
              isBreak: false,
              announcements: ['Tournament created'],
              payouts: []
            };
            
            setTournamentState(initialState);
            
            // Save this initial state for future use
            saveTournamentState(tournamentId, initialState);
            
            // Get players if any
            const savedPlayers = getPlayers(tournamentId);
            if (savedPlayers && savedPlayers.length > 0) {
              console.log('Loaded players from localStorage:', savedPlayers.length, 'players');
              setPlayers(savedPlayers);
            }
            
            // Load blind structure if available
            const savedBlinds = getStoredBlindStructure(tournamentId);
            if (savedBlinds && savedBlinds.length > 0) {
              console.log('Loaded blind structure from localStorage:', savedBlinds.length, 'levels');
              setBlindLevels(savedBlinds);
              setEditableBlinds(savedBlinds);
            }
            
            // Load tables if available
            const savedTables = getTables(tournamentId);
            if (savedTables && savedTables.length > 0) {
              console.log('Loaded tables from localStorage:', savedTables.length, 'tables');
              setTables(savedTables);
            }
          } else {
            // No tournament found in localStorage, show error
            setError('Tournament not found. Please check the URL or create a new tournament.');
          }
        }
      } catch (err) {
        console.error('Error fetching tournament:', err);
        setError('Failed to load tournament data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTournament();
  }, [tournamentId, isDemoTournament]);
  
  // Replace the auto-save effect with a throttled version
  useEffect(() => {
    // Clear any existing interval
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }
    
    // Set up a new interval for auto-saving (every 10 seconds)
    const intervalId = setInterval(() => {
      if (tournamentState && tournamentId !== 'demo') {
        const now = Date.now();
        // Throttle saves to prevent excessive updates
        if (now - lastSaveTime >= AUTO_SAVE_THROTTLE) {
          console.log('Auto-saving tournament state and data...');
          saveTournamentState(tournamentId, tournamentState);
          
          // Only save complete state when necessary and throttle it
          if (players.length > 0 || tables.length > 0) {
            saveCompleteTournamentState(tournamentId, tournamentState, players, tables);
          }
          
          setLastSaveTime(now);
        }
      }
    }, 10000); // Check every 10 seconds
    
    setAutoSaveInterval(intervalId);
    
    // Cleanup function to clear the interval when component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [tournamentId, tournamentState, players, tables, lastSaveTime]);

  // Modify the tournament state update effect to be throttled too
  useEffect(() => {
    if (tournamentState && tournamentId !== 'demo') {
      const now = Date.now();
      if (now - lastSaveTime >= AUTO_SAVE_THROTTLE) {
        console.log('Saving tournament state to localStorage on state change...');
        saveTournamentState(tournamentId, tournamentState);
        
        // Update last save time
        setLastSaveTime(now);
      }
    }
  }, [tournamentState, tournamentId, lastSaveTime]);

  // Also throttle the beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tournamentState && tournamentId !== 'demo') {
        console.log('Saving state before page unload');
        
        // Strip out unnecessary data
        const essentialState = {
          ...tournamentState,
          // Don't include announcements in the save to reduce size
          announcements: tournamentState.announcements.slice(0, 5)
        };
        
        saveTournamentState(tournamentId, essentialState);
        
        // Only save complete state if we have players
        if (players.length > 0) {
          saveCompleteTournamentState(tournamentId, essentialState, players, tables);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tournamentId, tournamentState, players, tables]);

  // Add this useEffect to initialize blindStructureState from blindStructure
  useEffect(() => {
    setBlindStructureState([...blindStructure]);
  }, []);

  // Calculate tournament statistics
  const calculateTournamentStats = useMemo(() => {
    const normalizedPlayers = players || [];
    const activePlayersCount = normalizedPlayers.filter(player => player.status === 'active' || player.status === 'final-table').length;
    const totalEntrants = normalizedPlayers.length;
    const totalRebuys = normalizedPlayers.reduce((sum, player) => sum + (player.rebuys || 0), 0);
    const totalAddOns = normalizedPlayers.reduce((sum, player) => sum + (player.addOns || 0), 0);
    const buyInTotal = totalEntrants * (tournament?.buyIn || 0);
    const rebuyTotal = totalRebuys * (tournament?.rebuyAmount || 0);
    const addOnTotal = totalAddOns * (tournament?.addOnAmount || 0);
    const feeTotal = totalEntrants * (tournament?.entryFee || 0);
    const prizePool = buyInTotal + rebuyTotal + addOnTotal;
    
    // Calculate total chips in play
    const totalChips = normalizedPlayers.reduce((sum, player) => sum + player.chips, 0);
    const averageStack = activePlayersCount > 0 ? Math.round(totalChips / activePlayersCount) : 0;
    
    // Count active tables
    const activeTables = new Set(normalizedPlayers
      .filter(player => player.status === 'active' || player.status === 'final-table')
      .map(player => player.tableNumber)
    ).size;
    
    // Update payouts based on new player count if needed
    if (normalizedPlayers.length > 0 && payouts.length === 0) {
      const newPayingPlaces = Math.max(1, Math.ceil(normalizedPlayers.length * 0.12));
      const buyInAmount = tournament?.buyIn ?? 0;
      const totalPrizePool = normalizedPlayers.length * buyInAmount;
      
      // Generate default payouts
      const defaultPayouts = generateDefaultPayouts(newPayingPlaces, totalPrizePool);
      setPayouts(defaultPayouts);
    }
    
    // Save the updated state to localStorage
    setTimeout(() => {
      if (tournamentState && tournamentId !== 'demo') {
        saveTournamentState(tournamentId, tournamentState);
      }
    }, 100);
    
    return {
      entrants: totalEntrants,
      remainingPlayers: activePlayersCount,
      averageStack,
      tablesRemaining: activeTables,
      prizePool,
      payingPlaces: payouts?.length || 0,
      totalRebuys,
      totalAddOns
    };
  }, [players, tournament, payouts, tournamentState, tournamentId]);

  // Use the calculated stats
  const tournamentStats = calculateTournamentStats;
  
  // Find the next available seat at a table
  const findNextAvailableSeat = () => {
    // Create a mapping of filled seats by table
    const filledSeats: Record<number, Set<number>> = {};
    tables.forEach(table => {
      filledSeats[table.id] = new Set<number>();
    });
    
    // Add all taken seats to the mapping
    players.forEach(player => {
      if (player.status === 'active' && player.tableNumber) {
        if (filledSeats[player.tableNumber]) {
          filledSeats[player.tableNumber].add(player.seatNumber);
        }
      }
    });
    
    // Find a table with available seats (prioritize filling existing tables)
    for (const table of tables) {
      const tableSeats = filledSeats[table.id];
      if (tableSeats && tableSeats.size < table.maxSeats) {
        // Find first available seat number
        for (let seat = 1; seat <= table.maxSeats; seat++) {
          if (!tableSeats.has(seat)) {
            return { tableNumber: table.id, seatNumber: seat };
          }
        }
      }
    }
    
    // If no seats available, create a new table
    const newTableId = Math.max(0, ...Object.keys(filledSeats).map(Number)) + 1;
    setTables(prev => [...prev, { id: newTableId, maxSeats: 9 }]);
    return { tableNumber: newTableId, seatNumber: 1 };
  };
  
  // Handle player updates with auto table/seat assignment
  const handlePlayersUpdate = (updatedPlayers: Player[]) => {
    // Ensure all players have rebuys and addOns properties
    const normalizedPlayers = updatedPlayers.map(player => ({
      ...player,
      rebuys: player.rebuys ?? 0,
      addOns: player.addOns ?? 0
    }));
    
    // Check if any new players need a table assignment
    const playersNeedingAssignment = normalizedPlayers.filter(player => 
      player.status === 'active' && 
      (!player.tableNumber || player.tableNumber === 0 || !player.seatNumber || player.seatNumber === 0)
    );
    
    // Assign tables and seats to new players
    if (playersNeedingAssignment.length > 0) {
      const assignedPlayers = [...normalizedPlayers];
      
      playersNeedingAssignment.forEach(player => {
        const playerIndex = assignedPlayers.findIndex(p => p.id === player.id);
        if (playerIndex !== -1) {
          const { tableNumber, seatNumber } = findNextAvailableSeat();
          assignedPlayers[playerIndex] = {
            ...assignedPlayers[playerIndex],
            tableNumber,
            seatNumber
          };
        }
      });
      
      setPlayers(assignedPlayers);
    } else {
      setPlayers(normalizedPlayers);
    }
    
    // Update payouts based on new player count if needed
    if (normalizedPlayers.length > 0 && payouts.length === 0) {
      const newPayingPlaces = Math.max(1, Math.ceil(normalizedPlayers.length * 0.12));
      const buyInAmount = tournament?.buyIn ?? 0;
      const totalPrizePool = normalizedPlayers.length * buyInAmount;
      
      // Generate default payouts
      const defaultPayouts = generateDefaultPayouts(newPayingPlaces, totalPrizePool);
      setPayouts(defaultPayouts);
    }
    
    // Save the updated state to localStorage
    setTimeout(() => {
      saveTournamentState(tournamentId, tournamentState);
    }, 100);
  };
  
  // Handle level change
  const handleLevelChange = (direction: 'next' | 'prev') => {
    if (!tournamentState) return; // Guard against null state
    
    let newLevel = direction === 'next' ? tournamentState.currentLevel + 1 : tournamentState.currentLevel - 1;
      
      // Ensure the level is within bounds
    newLevel = Math.max(1, Math.min(newLevel, blindLevels.length));
      
      // Check if should enter break
    const isBreak = tournamentState.nextBreak > 0 && newLevel % tournamentState.nextBreak === 0 && direction === 'next';
    
    // Calculate new level time
    const newLevelTime = isBreak ? tournamentState.breakLength * 60 : 20 * 60; // Break length or standard level time
    
    // Create the updated state
    const updatedState = {
      ...tournamentState,
        currentLevel: newLevel,
      blinds: blindLevels[newLevel - 1],
      levelTime: newLevelTime,
      isPaused: true, // Pause when changing levels
        isBreak
      };
    
    // Update the state
    setTournamentState(updatedState);
    
    // Announce level change
    if (newLevel > 0 && newLevel <= blindLevels.length) {
      const blindInfo = blindLevels[newLevel - 1];
      
      if (isBreak) {
        addAnnouncement(`Break time! We'll resume in ${tournamentState.breakLength} minutes.`);
      } else {
        const anteText = blindInfo.ante ? ` with ${blindInfo.ante} ante` : '';
        addAnnouncement(`Moving to Level ${newLevel}: ${blindInfo.small}/${blindInfo.big}${anteText}`);
      }
    }
    
    // Immediately save state to localStorage
    if (tournamentId !== 'demo') {
      console.log('Saving tournament state after level change');
      saveTournamentState(tournamentId, updatedState);
      
      if (players.length > 0) {
        saveCompleteTournamentState(tournamentId, updatedState, players, tables);
      }
    }
  };
  
  // Handle timer end
  const handleTimerEnd = () => {
    if (!tournamentState) return;
    
    console.log('Timer ended');
    
    // Create updated state
    let updatedState;
    
    if (tournamentState.isBreak) {
      // End the break and resume normal play
      updatedState = {
        ...tournamentState,
        isBreak: false,
        levelTime: 20 * 60, // Reset to standard level time
        isPaused: true, // Pause when break ends
      };
      
      addAnnouncement("Break has ended. Starting next level.");
    } else {
      // Move to next level and update all relevant state
      const newLevel = tournamentState.currentLevel + 1;
      
      // Ensure the level is within bounds
      const boundedNewLevel = Math.min(newLevel, blindLevels.length);
      
      // Check if should enter break
      const isBreak = tournamentState.nextBreak > 0 && boundedNewLevel % tournamentState.nextBreak === 0;
      
      updatedState = {
        ...tournamentState,
        currentLevel: boundedNewLevel,
        blinds: blindLevels[boundedNewLevel - 1],
        levelTime: isBreak ? tournamentState.breakLength * 60 : 20 * 60,
        isPaused: true, // Pause when level changes
        isBreak
      };
      
      // Announce the change
      if (isBreak) {
        addAnnouncement(`Break time! We'll resume in ${tournamentState.breakLength} minutes.`);
      } else {
        const blindInfo = blindLevels[boundedNewLevel - 1];
        const anteText = blindInfo.ante ? ` with ${blindInfo.ante} ante` : '';
        addAnnouncement(`Moving to Level ${boundedNewLevel}: ${blindInfo.small}/${blindInfo.big}${anteText}`);
      }
    }
    
    // Update the state
    setTournamentState(updatedState);
    
    // Immediately save state to localStorage
    if (tournamentId !== 'demo') {
      console.log('Saving tournament state after timer end');
      saveTournamentState(tournamentId, updatedState);
      
      if (players.length > 0) {
        saveCompleteTournamentState(tournamentId, updatedState, players, tables);
      }
    }
  };
  
  // Toggle pause state
  const togglePause = () => {
    if (!tournamentState) return;
    
    const newIsPaused = !tournamentState.isPaused;
    
    setTournamentState(prev => {
      if (!prev) return null;
      
      // Add announcement when tournament starts or pauses
      if (newIsPaused) {
        addAnnouncement("Tournament clock paused");
      } else if (prev.currentLevel === 1 && prev.isPaused) {
        addAnnouncement("Tournament has started!");
      } else {
        addAnnouncement("Tournament clock resumed");
      }
      
      // Create the updated state
      const updatedState = {
      ...prev,
        isPaused: newIsPaused
      };
      
      // Immediately save to localStorage for better persistence
      if (tournamentId !== 'demo') {
        console.log('Immediately saving pause state change');
        saveTournamentState(tournamentId, updatedState);
      }
      
      return updatedState;
    });
  };
  
  // Modify the addAnnouncement function to also create a notification
  const addAnnouncement = (message: string) => {
    if (!tournamentState) return;
    
    // Create timestamp for the announcement
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Update tournament state with the announcement
    setTournamentState(prev => {
      if (!prev) return null;
      return {
      ...prev,
        announcements: [message, ...(prev.announcements || []).slice(0, 4)] // Keep last 5 announcements
      };
    });
    
    // Create a notification from the announcement
    const notificationId = `notif-${Date.now()}`;
    setNotifications(prev => [
      {
        id: notificationId,
        message,
        type: 'info',
        time,
        read: false
      },
      ...prev
    ]);
  };
  
  // Add notification handlers
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  const dismissAllNotifications = () => {
    setNotifications([]);
  };
  
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  // Handle payouts update
  const handlePayoutsUpdate = (payouts: Payout[]) => {
    setPayouts(payouts);
  };

  // Add this function to handle blind level updates
  const updateBlindLevel = (index: number, field: keyof Blind, value: number) => {
    const newStructure = [...blindLevels];
    newStructure[index] = {
      ...newStructure[index],
      [field]: value
    };
    setBlindLevels(newStructure);
  };

  // Update the saveBlindStructure function to save properly to localStorage
  const saveBlindStructureHandler = () => {
    if (!tournamentState || tournamentId === 'demo') return;
    
    // Save the edited blind structure to localStorage
    if (blindLevels.length > 0) {
      console.log('Saving blind structure to localStorage');
      // Use the imported function from localStorage.ts
      saveStoredBlindStructure(tournamentId, blindLevels); 
      
      // Only change the editing state if we have blinds to save
      setIsEditingBlinds(false);
    }
    
    // Update current blind level
    const currentLevelIndex = (tournamentState.currentLevel || 1) - 1;
    if (currentLevelIndex >= 0 && currentLevelIndex < blindLevels.length) {
      const currentLevelBlind = blindLevels[currentLevelIndex];
      if (currentLevelBlind) {
        setTournamentState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            blinds: currentLevelBlind
          };
        });
      }
    }
    
    // Announce the update
    addAnnouncement("Blind structure has been updated");
  };

  // Utility function to ensure state gets saved
  const forceSaveState = useCallback(() => {
    if (!tournamentState || tournamentId === 'demo') return;
    
    try {
      console.log('Force saving tournament state');
      
      // Strip out unnecessary data and deep clone to ensure no circular references
      const essentialState = JSON.parse(JSON.stringify({
        ...tournamentState,
        // Don't include announcements in the save to reduce size
        announcements: tournamentState.announcements.slice(0, 5)
      }));
      
      // Set debug info
      setDebugInfo(`Saving at ${new Date().toLocaleTimeString()}: ${players.length} players, ${tables.length} tables`);
      
      // Clean the players data before saving
      // Using type assertion to handle the null vs undefined type mismatch
      const cleanPlayers = players.map(player => ({
        ...player,
        // Convert undefined to undefined (not null) to match Player type
        finishPosition: player.finishPosition,
        rebuys: player.rebuys || 0,
        addOns: player.addOns || 0
      })) as Player[];
      
      // First try to save tournament state
      const stateSaved = saveTournamentState(tournamentId, essentialState);
      
      // Then try to save complete state
      if (players.length > 0 || tables.length > 0) {
        const completeSaved = saveCompleteTournamentState(tournamentId, essentialState, cleanPlayers, tables);
        
        setDebugInfo(prev => `${prev}\nState save: ${stateSaved ? 'Success' : 'Failed'}, Complete save: ${completeSaved ? 'Success' : 'Failed'}`);
      } else {
        setDebugInfo(prev => `${prev}\nState save: ${stateSaved ? 'Success' : 'Failed'}, No players/tables to save`);
      }
      
      // Update last save time
      setLastSaveTime(Date.now());
      
      // Add notification
      const notificationId = `notif-${Date.now()}`;
      setNotifications(prev => [
        {
          id: notificationId,
          message: "Tournament state saved successfully",
          type: 'success',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false
        },
        ...prev
      ]);
      
      return true;
    } catch (error: unknown) {
      console.error('Error during force save:', error);
      // Handle error message safely
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(`Error during save: ${errorMessage}`);
      return false;
    }
  }, [tournamentId, tournamentState, players, tables]);

  // When tabs are clicked, scroll to the top (especially useful for mobile)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, mobileTab]);

  // Add a function to get eliminated player positions
  const getEliminatedPositions = (): number[] => {
    return players
      .filter(player => player.status === 'eliminated' && player.finishPosition)
      .map(player => player.finishPosition as number);
  };

  // Determine which content to show first
  const renderMainContent = () => {
    // Always show the selected tab content first
    if (activeTab === 'players' || mobileTab === 'players') {
  return (
        <>
          {/* Players Tab */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Player Management</h2>
            <PlayerManager 
              tournamentId={tournament?.id || ''}
              buyIn={tournament?.buyIn || 0}
              startingChips={tournament?.startingChips || 0}
              allowRebuys={true}
              allowAddOns={tournament?.allowAddOns || false}
              rebuyAmount={tournament?.rebuyAmount || 0}
              rebuyChips={tournament?.rebuyChips || 0}
              addOnAmount={tournament?.addOnAmount || 0}
              addOnChips={tournament?.addOnChips || 0}
              maxRebuys={tournament?.maxRebuys || 0}
              initialPlayers={players}
              onPlayerUpdate={handlePlayersUpdate}
              findNextAvailableSeat={findNextAvailableSeat}
            />
          </div>
          
          {/* Clock Tab (shown below in players view) */}
          <div className="space-y-6">
            <TournamentClock 
              currentLevel={tournamentState?.currentLevel || 1}
              smallBlind={tournamentState?.blinds?.small || 25}
              bigBlind={tournamentState?.blinds?.big || 50}
              ante={(tournamentState?.blinds?.ante || 0)}
              timeRemaining={tournamentState?.levelTime || 1200}
              isBreak={tournamentState?.isBreak || false}
              isPaused={tournamentState?.isPaused || true}
              prizePool={tournamentStats.prizePool}
              payouts={payouts}
              eliminatedPlayers={getEliminatedPositions()}
              onTimerEnd={handleTimerEnd}
              onPauseToggle={togglePause}
              onNextLevel={() => handleLevelChange('next')}
              onPrevLevel={() => handleLevelChange('prev')}
            />
          </div>
        </>
      );
    } else if (activeTab === 'tables' || mobileTab === 'tables') {
      return (
        <>
          {/* Tables Tab */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Table Management</h2>
            <TableManager 
              maxPlayersPerTable={9}
              players={players}
              onPlayersUpdate={handlePlayersUpdate}
            />
        </div>
          
          {/* Clock Tab (shown below in tables view) */}
          <div className="space-y-6">
            <TournamentClock 
              currentLevel={tournamentState?.currentLevel || 1}
              smallBlind={tournamentState?.blinds?.small || 25}
              bigBlind={tournamentState?.blinds?.big || 50}
              ante={(tournamentState?.blinds?.ante || 0)}
              timeRemaining={tournamentState?.levelTime || 1200}
              isBreak={tournamentState?.isBreak || false}
              isPaused={tournamentState?.isPaused || true}
              prizePool={tournamentStats.prizePool}
              payouts={payouts}
              eliminatedPlayers={getEliminatedPositions()}
              onTimerEnd={handleTimerEnd}
              onPauseToggle={togglePause}
              onNextLevel={() => handleLevelChange('next')}
              onPrevLevel={() => handleLevelChange('prev')}
            />
        </div>
        </>
      );
    } else if (activeTab === 'payouts' || mobileTab === 'payouts') {
      return (
        <>
          {/* Payouts Tab */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Payout Calculator</h2>
            <PayoutCalculator 
              entrants={tournamentStats.entrants}
              buyIn={tournament?.buyIn || 0}
              fees={tournament?.entryFee || 0}
              rebuys={tournamentStats.totalRebuys}
              rebuyAmount={tournament?.rebuyAmount || 0}
              addOns={tournamentStats.totalAddOns}
              addOnAmount={tournament?.addOnAmount || 0}
              onPayoutsCalculated={handlePayoutsUpdate}
            />
      </div>
      
          {/* Clock Tab (shown below in payouts view) */}
          <div className="space-y-6">
            <TournamentClock 
              currentLevel={tournamentState?.currentLevel || 1}
              smallBlind={tournamentState?.blinds?.small || 25}
              bigBlind={tournamentState?.blinds?.big || 50}
              ante={(tournamentState?.blinds?.ante || 0)}
              timeRemaining={tournamentState?.levelTime || 1200}
              isBreak={tournamentState?.isBreak || false}
              isPaused={tournamentState?.isPaused || true}
              prizePool={tournamentStats.prizePool}
              payouts={payouts}
              eliminatedPlayers={getEliminatedPositions()}
              onTimerEnd={handleTimerEnd}
              onPauseToggle={togglePause}
              onNextLevel={() => handleLevelChange('next')}
              onPrevLevel={() => handleLevelChange('prev')}
            />
          </div>
        </>
      );
    } else if (activeTab === 'blinds' || mobileTab === 'blinds') {
      return (
        <motion.div
          key="blinds"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Blind Structure</h2>
              {isEditingBlinds ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingBlinds(false)}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveBlindStructureHandler}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                  <button
                  onClick={() => setIsEditingBlinds(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                  >
                  Edit Blind Structure
                  </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="pb-3 font-medium">Level</th>
                    <th className="pb-3 font-medium">Small Blind</th>
                    <th className="pb-3 font-medium">Big Blind</th>
                    <th className="pb-3 font-medium">Ante</th>
                    <th className="pb-3 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {blindLevels.map((level, index) => (
                    <tr 
                      key={index}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        tournamentState?.currentLevel === index + 1 ? 'bg-green-900/20' : ''
                      }`}
                    >
                      <td className="py-3">
                        Level {index + 1}
                        {tournamentState?.currentLevel === index + 1 && 
                          <span className="ml-2 text-green-500">← Current</span>
                        }
                      </td>
                      <td className="py-3">
                        {isEditingBlinds ? (
                          <input
                            type="number"
                            min="1"
                            className="w-20 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                            value={level.small}
                            onChange={(e) => updateBlindLevel(index, 'small', Number(e.target.value))}
                          />
                        ) : (
                          level.small
                        )}
                      </td>
                      <td className="py-3">
                        {isEditingBlinds ? (
                          <input
                            type="number"
                            min="1"
                            className="w-20 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                            value={level.big}
                            onChange={(e) => updateBlindLevel(index, 'big', Number(e.target.value))}
                          />
                        ) : (
                          level.big
                        )}
                      </td>
                      <td className="py-3">
                        {isEditingBlinds ? (
                          <input
                            type="number"
                            min="0"
                            className="w-20 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                            value={level.ante || 0}
                            onChange={(e) => updateBlindLevel(index, 'ante', Number(e.target.value))}
                          />
                        ) : (
                          level.ante || '-'
                        )}
                      </td>
                      <td className="py-3">
                        {Math.floor((tournamentState?.levelTime || 1200) / 60)} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                  </div>
                  </div>
        </motion.div>
      );
    } else {
      // Default clock view
      return (
              <div className="space-y-6">
                <TournamentClock 
            currentLevel={tournamentState?.currentLevel || 1}
            smallBlind={tournamentState?.blinds?.small || 25}
            bigBlind={tournamentState?.blinds?.big || 50}
            ante={(tournamentState?.blinds?.ante || 0)}
            timeRemaining={tournamentState?.levelTime || 1200}
            isBreak={tournamentState?.isBreak || false}
            isPaused={tournamentState?.isPaused || true}
            prizePool={tournamentStats.prizePool}
            payouts={payouts}
            eliminatedPlayers={getEliminatedPositions()}
                  onTimerEnd={handleTimerEnd}
                  onPauseToggle={togglePause}
                  onNextLevel={() => handleLevelChange('next')}
                  onPrevLevel={() => handleLevelChange('prev')}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tournament Stats */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">Tournament Statistics</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Entrants</div>
                  <div className="text-xl font-bold">{tournamentStats.entrants}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Remaining</div>
                  <div className="text-xl font-bold">{tournamentStats.remainingPlayers}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Average Stack</div>
                  <div className="text-xl font-bold">
                    {tournamentStats.averageStack > 0 ? tournamentStats.averageStack.toLocaleString() : "-"}
                  </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Tables</div>
                  <div className="text-xl font-bold">{tournamentStats.tablesRemaining}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Prize Pool</div>
                  <div className="text-xl font-bold">${tournamentStats.prizePool.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Paying Places</div>
                  <div className="text-xl font-bold">{tournamentStats.payingPlaces}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Announcements */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold">Announcements</h2>
                      <button 
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded"
                        onClick={() => addAnnouncement("New announcement " + new Date().toLocaleTimeString())}
                      >
                        Add Announcement
                      </button>
                    </div>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                {tournamentState?.announcements.map((announcement, i) => (
                        <li 
                          key={i} 
                          className="text-sm p-2 rounded bg-gray-700 border-l-2 border-emerald-500"
                        >
                          {announcement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Blind Structure Preview */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-bold mb-4">Upcoming Levels</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-2">Level</th>
                          <th className="text-left p-2">Small Blind</th>
                          <th className="text-left p-2">Big Blind</th>
                          <th className="text-left p-2">Ante</th>
                          <th className="text-left p-2 hidden md:table-cell">SB/BB Ratio</th>
                          <th className="text-left p-2 hidden md:table-cell">BB/Starting Stack</th>
                        </tr>
                      </thead>
                      <tbody>
                  {blindStructure.slice(
                    Math.max(0, (tournamentState?.currentLevel || 1) - 1), 
                    Math.min(blindStructure.length, (tournamentState?.currentLevel || 1) + 5)
                  ).map((level, i) => {
                    const levelNumber = (tournamentState?.currentLevel || 1) + i;
                          const isCurrentLevel = i === 0;
                          
                          return (
                            <tr 
                              key={i} 
                              className={`border-b border-gray-700 ${isCurrentLevel ? 'bg-emerald-900 bg-opacity-20' : ''}`}
                            >
                              <td className="p-2 font-medium">
                                {isCurrentLevel ? '→ ' : ''}{levelNumber}
                          {levelNumber % (tournamentState?.nextBreak || 999) === 0 ? ' (Break)' : ''}
                              </td>
                              <td className="p-2">{level.small}</td>
                              <td className="p-2">{level.big}</td>
                              <td className="p-2">{level.ante || '-'}</td>
                              <td className="p-2 hidden md:table-cell">1:
                                {Math.round((level.big/level.small) * 10) / 10}
                              </td>
                              <td className="p-2 hidden md:table-cell">1:
                          {Math.round((tournament?.startingChips || 10000) / level.big)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f9f9] to-[#f1f1f1] dark:from-[#111111] dark:to-[#000000] text-gray-900 dark:text-white transition-colors duration-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md dark:bg-black/40 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-screen-xl mx-auto p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold tracking-tight"
              >
                {tournament?.name || 'Tournament'}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Buy-in: ${tournament?.buyIn || 0} • Starting Stack: {tournament?.startingChips?.toLocaleString() || 0} • Status: {tournamentState?.isPaused ? 'paused' : 'running'}
              </motion.p>
            </div>
            
            <div className="flex gap-2">
              <Link href="/" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                Home
              </Link>
              <Link href="/tournament/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                New Tournament
              </Link>
              <button 
                onClick={forceSaveState}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Save State
              </button>
              {debugInfo && (
                <div className="fixed bottom-20 left-4 bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700 text-xs font-mono text-gray-300 max-w-sm z-50 whitespace-pre-wrap">
                  <div className="flex justify-between items-center mb-2">
                    <strong>Debug Info</strong>
                    <button onClick={() => setDebugInfo('')} className="text-gray-500 hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {debugInfo}
              </div>
            )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className="bg-white/30 dark:bg-black/40 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-screen-xl mx-auto">
          <nav className="flex overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab('clock')}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'clock' 
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Clock
            </button>
            <button 
              onClick={() => setActiveTab('players')}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'players' 
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Players
            </button>
            <button 
              onClick={() => setActiveTab('tables')}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'tables' 
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Tables
            </button>
            <button 
              onClick={() => setActiveTab('payouts')}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'payouts' 
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Payouts
            </button>
            <button 
              onClick={() => setActiveTab('blinds')}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'blinds' 
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Blind Structure
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'clock' && (
            <motion.div
              key="clock"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TournamentClock 
                currentLevel={tournamentState?.currentLevel || 1}
                smallBlind={tournamentState?.blinds?.small || 25}
                bigBlind={tournamentState?.blinds?.big || 50}
                ante={(tournamentState?.blinds?.ante || 0)}
                timeRemaining={tournamentState?.levelTime || 1200}
                isBreak={tournamentState?.isBreak || false}
                isPaused={tournamentState?.isPaused || true}
                prizePool={tournamentStats.prizePool}
                payouts={payouts}
                eliminatedPlayers={getEliminatedPositions()}
                onTimerEnd={handleTimerEnd}
                onPauseToggle={togglePause}
                onNextLevel={() => handleLevelChange('next')}
                onPrevLevel={() => handleLevelChange('prev')}
              />
            </motion.div>
          )}
          
          {activeTab === 'players' && (
            <motion.div
              key="players"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
                <PlayerManager 
                tournamentId={tournament?.id || ''}
                buyIn={tournament?.buyIn || 0}
                startingChips={tournament?.startingChips || 0}
                  allowRebuys={true}
                allowAddOns={tournament?.allowAddOns || false}
                rebuyAmount={tournament?.rebuyAmount || 0}
                rebuyChips={tournament?.rebuyChips || 0}
                addOnAmount={tournament?.addOnAmount || 0}
                addOnChips={tournament?.addOnChips || 0}
                maxRebuys={tournament?.maxRebuys || 0}
                initialPlayers={players}
                onPlayerUpdate={handlePlayersUpdate}
                findNextAvailableSeat={findNextAvailableSeat}
              />
            </motion.div>
          )}
          
          {activeTab === 'tables' && (
            <motion.div
              key="tables"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
                <TableManager 
                  maxPlayersPerTable={9}
                players={players}
                onPlayersUpdate={handlePlayersUpdate}
              />
            </motion.div>
          )}
          
          {activeTab === 'payouts' && (
            <motion.div
              key="payouts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
                <PayoutCalculator 
                entrants={tournamentStats.entrants}
                buyIn={tournament?.buyIn || 0}
                fees={tournament?.entryFee || 0}
                rebuys={tournamentStats.totalRebuys}
                rebuyAmount={tournament?.rebuyAmount || 0}
                addOns={tournamentStats.totalAddOns}
                addOnAmount={tournament?.addOnAmount || 0}
                  onPayoutsCalculated={handlePayoutsUpdate}
                />
            </motion.div>
          )}
          
          {activeTab === 'blinds' && (
            <motion.div
              key="blinds"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Blind Structure</h2>
                  {isEditingBlinds ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingBlinds(false)}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveBlindStructureHandler}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                      >
                        Save Changes
                      </button>
              </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingBlinds(true)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                    >
                      Edit Blind Structure
                    </button>
            )}
          </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="pb-3 font-medium">Level</th>
                        <th className="pb-3 font-medium">Small Blind</th>
                        <th className="pb-3 font-medium">Big Blind</th>
                        <th className="pb-3 font-medium">Ante</th>
                        <th className="pb-3 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blindLevels.map((level, index) => (
                        <tr 
                          key={index}
                          className={`border-b border-gray-200 dark:border-gray-800 ${
                            tournamentState?.currentLevel === index + 1 ? 'bg-green-900/20' : ''
                          }`}
                        >
                          <td className="py-3">
                            Level {index + 1}
                            {tournamentState?.currentLevel === index + 1 && 
                              <span className="ml-2 text-green-500">← Current</span>
                            }
                          </td>
                          <td className="py-3">
                            {isEditingBlinds ? (
                              <input
                                type="number"
                                min="1"
                                className="w-20 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                                value={level.small}
                                onChange={(e) => updateBlindLevel(index, 'small', Number(e.target.value))}
                              />
                            ) : (
                              level.small
                            )}
                          </td>
                          <td className="py-3">
                            {isEditingBlinds ? (
                              <input
                                type="number"
                                min="1"
                                className="w-20 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                                value={level.big}
                                onChange={(e) => updateBlindLevel(index, 'big', Number(e.target.value))}
                              />
                            ) : (
                              level.big
                            )}
                          </td>
                          <td className="py-3">
                            {isEditingBlinds ? (
                              <input
                                type="number"
                                min="0"
                                className="w-20 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                                value={level.ante || 0}
                                onChange={(e) => updateBlindLevel(index, 'ante', Number(e.target.value))}
                              />
                            ) : (
                              level.ante || '-'
                            )}
                          </td>
                          <td className="py-3">
                            {Math.floor((tournamentState?.levelTime || 1200) / 60)} min
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
        </div>
      </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Notifications component */}
      <Notifications 
        notifications={notifications}
        onDismiss={dismissNotification}
        onDismissAll={dismissAllNotifications}
        onMarkAsRead={markNotificationAsRead}
      />
      
      {/* Add global styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
} 