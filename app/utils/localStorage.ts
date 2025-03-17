import { Player, Blind, TableConfig, Payout } from '@/app/types';

// Define interfaces locally if they're not exported from types
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

// Use Blind from imports instead
type BlindLevel = Blind;

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
  lastUpdated?: string;
  created_at?: string;
}

// Keys for localStorage
const TOURNAMENTS_KEY = 'poker_tournaments';
const PLAYERS_PREFIX = 'poker_players_';
const BLINDS_PREFIX = 'tournament_blinds_';
const TOURNAMENT_STATE_PREFIX = 'tournament_state_';
const TABLES_PREFIX = 'tournament_tables_';

// Setting a version to help with potential migrations in the future
const STORAGE_VERSION = '1.0';

// Initialize localStorage with version
const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const version = localStorage.getItem('storage_version');
    if (!version) {
      localStorage.setItem('storage_version', STORAGE_VERSION);
    }
  } catch (err) {
    console.error('Failed to initialize localStorage:', err);
  }
};

// Call initialization when this module is imported
if (typeof window !== 'undefined') {
  initializeStorage();
}

// Tournament Storage Functions
export const getTournaments = (): Tournament[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const tournamentsJson = localStorage.getItem(TOURNAMENTS_KEY);
    if (!tournamentsJson) return [];
    return JSON.parse(tournamentsJson);
  } catch (err) {
    console.error('Error getting tournaments from localStorage:', err);
    return [];
  }
};

export const getTournamentById = (id: string): Tournament | null => {
  try {
    const tournaments = getTournaments();
    return tournaments.find(t => t.id === id) || null;
  } catch (err) {
    console.error('Error getting tournament by ID:', err);
    return null;
  }
};

export const saveTournament = (tournament: Tournament, skipStateUpdate = false): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const tournaments = getTournaments();
    const existingIndex = tournaments.findIndex(t => t.id === tournament.id);
    
    if (existingIndex >= 0) {
      // Update existing tournament
      tournaments[existingIndex] = tournament;
    } else {
      // Add new tournament
      tournaments.push(tournament);
    }
    
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
    
    // Only update the state if skipStateUpdate is false
    if (!skipStateUpdate) {
      // Also save to the state storage to ensure consistency
      const existingState = getTournamentState(tournament.id);
      if (existingState) {
        saveTournamentState(tournament.id, {
          ...existingState,
          ...tournament  // Update with the new tournament properties
        }, true); // Pass true to skip the tournament update
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error saving tournament to localStorage:', err);
    return false;
  }
};

export const deleteTournament = (id: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const tournaments = getTournaments();
    const updatedTournaments = tournaments.filter(t => t.id !== id);
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(updatedTournaments));
    
    // Also delete associated data
    localStorage.removeItem(`${PLAYERS_PREFIX}${id}`);
    localStorage.removeItem(`${BLINDS_PREFIX}${id}`);
    localStorage.removeItem(`${TOURNAMENT_STATE_PREFIX}${id}`);
    localStorage.removeItem(`${TABLES_PREFIX}${id}`);
    return true;
  } catch (err) {
    console.error('Error deleting tournament from localStorage:', err);
    return false;
  }
};

// Players Storage Functions
export const getPlayers = (tournamentId: string): Player[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const playersJson = localStorage.getItem(`${PLAYERS_PREFIX}${tournamentId}`);
    if (!playersJson) return [];
    return JSON.parse(playersJson);
  } catch (err) {
    console.error('Error getting players from localStorage:', err);
    return [];
  }
};

export const savePlayer = (player: Player, tournamentId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const players = getPlayers(tournamentId);
    const existingIndex = players.findIndex(p => p.id === player.id);
    
    if (existingIndex >= 0) {
      // Update existing player
      players[existingIndex] = player;
    } else {
      // Add new player
      players.push(player);
    }
    
    localStorage.setItem(`${PLAYERS_PREFIX}${tournamentId}`, JSON.stringify(players));
    return true;
  } catch (err) {
    console.error('Error saving player to localStorage:', err);
    return false;
  }
};

export const savePlayers = (players: Player[], tournamentId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(`${PLAYERS_PREFIX}${tournamentId}`, JSON.stringify(players));
    return true;
  } catch (err) {
    console.error('Error saving players to localStorage:', err);
    return false;
  }
};

export const deletePlayer = (playerId: string, tournamentId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const players = getPlayers(tournamentId);
    const updatedPlayers = players.filter(p => p.id !== playerId);
    localStorage.setItem(`${PLAYERS_PREFIX}${tournamentId}`, JSON.stringify(updatedPlayers));
    return true;
  } catch (err) {
    console.error('Error deleting player from localStorage:', err);
    return false;
  }
};

// Blind structure functions
export const saveBlindStructure = (tournamentId: string, blinds: BlindLevel[]): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(`${BLINDS_PREFIX}${tournamentId}`, JSON.stringify(blinds));
    return true;
  } catch (err) {
    console.error('Error saving blind structure to localStorage:', err);
    return false;
  }
};

export const getBlindStructure = (tournamentId: string): BlindLevel[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const blindsJson = localStorage.getItem(`${BLINDS_PREFIX}${tournamentId}`);
    if (!blindsJson) return [];
    return JSON.parse(blindsJson);
  } catch (err) {
    console.error('Error getting blind structure from localStorage:', err);
    return [];
  }
};

// Tournament state functions (for complete tournament state including runtime data)
export const saveTournamentState = (tournamentId: string, state: any, skipTournamentUpdate = false): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Remove circular references and functions
    const safeState = JSON.parse(JSON.stringify({
      ...state,
      lastUpdated: new Date().toISOString()
    }));
    
    localStorage.setItem(`${TOURNAMENT_STATE_PREFIX}${tournamentId}`, JSON.stringify(safeState));
    
    // Only update the tournament if skipTournamentUpdate is false
    if (!skipTournamentUpdate && state.name && state.startingChips) {
      const tournamentData: Tournament = {
        id: tournamentId,
        name: state.name,
        startingChips: state.startingChips,
        buyIn: state.buyIn,
        entryFee: state.entryFee,
        maxRebuys: state.maxRebuys,
        rebuyAmount: state.rebuyAmount,
        rebuyChips: state.rebuyChips,
        allowAddOns: state.allowAddOns,
        addOnAmount: state.addOnAmount,
        addOnChips: state.addOnChips,
        nextBreak: state.nextBreak,
        breakLength: state.breakLength,
        created_at: state.created_at || new Date().toISOString()
      };
      
      saveTournament(tournamentData, true); // Pass true to skip updating the state again
    }
    
    return true;
  } catch (err) {
    console.error('Error saving tournament state to localStorage:', err);
    return false;
  }
};

export const getTournamentState = (tournamentId: string): any | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stateJson = localStorage.getItem(`${TOURNAMENT_STATE_PREFIX}${tournamentId}`);
    if (!stateJson) {
      // If no state exists, try to construct one from the tournament and blinds
      const tournament = getTournamentById(tournamentId);
      if (tournament) {
        const blindStructure = getBlindStructure(tournamentId);
        const players = getPlayers(tournamentId);
        
        // Create a basic state object
        return {
          ...tournament,
          currentLevel: 1,
          levelTime: 20 * 60, // Default 20 minutes in seconds
          isPaused: true,
          blinds: blindStructure[0] || { small: 25, big: 50, ante: 0 },
          isBreak: false,
          announcements: ['Tournament created'],
          payouts: [],
          players
        };
      }
      return null;
    }
    return JSON.parse(stateJson);
  } catch (err) {
    console.error('Error getting tournament state from localStorage:', err);
    return null;
  }
};

// Complete tournament state functions
export const saveCompleteTournamentState = (tournamentId: string, tournamentState: TournamentState, players: Player[], tables: any[] = []): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Save the tournament state, skip tournament update for now
    saveTournamentState(tournamentId, tournamentState, true);
    
    // Save players
    savePlayers(players, tournamentId);
    
    // Save tables
    saveTables(tournamentId, tables);
    
    // Always update the main tournament record too
    const tournamentData: Tournament = {
      id: tournamentId,
      name: tournamentState.name,
      startingChips: tournamentState.startingChips,
      buyIn: tournamentState.buyIn,
      entryFee: tournamentState.entryFee,
      maxRebuys: tournamentState.maxRebuys,
      rebuyAmount: tournamentState.rebuyAmount,
      rebuyChips: tournamentState.rebuyChips,
      allowAddOns: tournamentState.allowAddOns,
      addOnAmount: tournamentState.addOnAmount,
      addOnChips: tournamentState.addOnChips,
      nextBreak: tournamentState.nextBreak,
      breakLength: tournamentState.breakLength,
      created_at: tournamentState.created_at || new Date().toISOString()
    };
    
    // Update the tournament record without updating state again
    saveTournament(tournamentData, true);
    
    return true;
  } catch (err) {
    console.error('Error saving complete tournament state:', err);
    return false;
  }
};

export const getCompleteTournamentState = (tournamentId: string): { tournamentState: TournamentState | null, players: Player[], tables: any[] } => {
  if (typeof window === 'undefined') {
    return { tournamentState: null, players: [], tables: [] };
  }
  
  try {
    // Get the tournament state
    const tournamentState = getTournamentState(tournamentId);
    
    // Get players
    const players = getPlayers(tournamentId);
    
    // Get tables
    const tables = getTables(tournamentId);
    
    return {
      tournamentState,
      players,
      tables
    };
  } catch (err) {
    console.error('Error getting complete tournament state:', err);
    return { tournamentState: null, players: [], tables: [] };
  }
};

// Table storage functions
export const saveTables = (tournamentId: string, tables: any[]): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem(`${TABLES_PREFIX}${tournamentId}`, JSON.stringify(tables));
    return true;
  } catch (err) {
    console.error('Error saving tables to localStorage:', err);
    return false;
  }
};

export const getTables = (tournamentId: string): any[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const tablesJson = localStorage.getItem(`${TABLES_PREFIX}${tournamentId}`);
    if (!tablesJson) return [];
    return JSON.parse(tablesJson);
  } catch (err) {
    console.error('Error getting tables from localStorage:', err);
    return [];
  }
};

// Utility function to get localStorage usage
export const getLocalStorageUsage = (): { used: number, remaining: number, items: number } => {
  if (typeof window === 'undefined') {
    return { used: 0, remaining: 0, items: 0 };
  }
  
  let totalSize = 0;
  let itemCount = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
          itemCount++;
        }
      }
    }
    
    // localStorage typically has a limit of around 5MB (varies by browser)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
    
    return {
      used: totalSize,
      remaining: estimatedLimit - totalSize,
      items: itemCount
    };
  } catch (err) {
    console.error('Error calculating localStorage usage:', err);
    return { used: 0, remaining: 0, items: 0 };
  }
};

// Utility function to clear all data
export const clearAllData = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.clear();
    initializeStorage(); // Reinitialize with version
    return true;
  } catch (err) {
    console.error('Error clearing localStorage:', err);
    return false;
  }
}; 