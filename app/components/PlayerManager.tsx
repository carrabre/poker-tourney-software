'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/app/types';
import { getPlayers, savePlayer, savePlayers, deletePlayer } from '@/app/utils/localStorage';

interface PlayerManagerProps {
  tournamentId: string;
  buyIn: number;
  startingChips: number;
  rebuyAmount: number;
  rebuyChips: number;
  addOnAmount: number;
  addOnChips: number;
  allowRebuys: boolean;
  allowAddOns: boolean;
  maxRebuys: number;
  initialPlayers?: Player[];
  onPlayerUpdate: (players: Player[]) => void;
  findNextAvailableSeat?: () => { tableNumber: number, seatNumber: number };
}

// Function to get ordinal suffix for numbers
const getOrdinalSuffix = (n: number): string => {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const PlayerManager: React.FC<PlayerManagerProps> = ({
  tournamentId,
  buyIn,
  startingChips,
  rebuyAmount,
  rebuyChips,
  addOnAmount,
  addOnChips,
  allowRebuys,
  allowAddOns,
  maxRebuys,
  initialPlayers = [],
  onPlayerUpdate,
  findNextAvailableSeat,
}) => {
  // Player state
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  
  // Track total entries and prize pool
  const totalEntries = players.length;
  const totalRebuys = players.reduce((sum, player) => sum + player.rebuys, 0);
  const totalAddOns = players.reduce((sum, player) => sum + player.addOns, 0);
  const prizePool = (totalEntries * buyIn) + (totalRebuys * rebuyAmount) + (totalAddOns * addOnAmount);
  
  // New player form state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [newPlayerTable, setNewPlayerTable] = useState<number | ''>('');
  const [newPlayerSeat, setNewPlayerSeat] = useState<number | ''>('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'eliminated' | 'final-table'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'chips' | 'table'>('table');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Effect to load players from localStorage on mount
  useEffect(() => {
    const fetchPlayers = () => {
      const storedPlayers = getPlayers(tournamentId);
      if (storedPlayers && storedPlayers.length > 0) {
        setPlayers(storedPlayers);
        onPlayerUpdate(storedPlayers);
      }
    };

    // If initialPlayers is empty, fetch from localStorage
    if (initialPlayers.length === 0) {
      fetchPlayers();
    }
  }, [tournamentId, initialPlayers.length, onPlayerUpdate]);
  
  // Check for seat conflicts
  const checkSeatConflict = (tableNumber: number, seatNumber: number, playerId?: string): boolean => {
    return players.some(player => 
      player.status === 'active' && 
      player.tableNumber === tableNumber && 
      player.seatNumber === seatNumber && 
      (!playerId || player.id !== playerId)
    );
  };
  
  // Get an array of available tables and their occupancy
  const getTableOccupancy = (): Record<number, number> => {
    const tableOccupancy: Record<number, number> = {};
    
    // Find all active tables
    players.forEach(player => {
      if (player.status === 'active' && player.tableNumber > 0) {
        if (!tableOccupancy[player.tableNumber]) {
          tableOccupancy[player.tableNumber] = 0;
        }
        tableOccupancy[player.tableNumber]++;
      }
    });
    
    return tableOccupancy;
  };
  
  // Enhanced auto-assign table seat with random distribution
  const autoAssignTableSeat = (): { tableNumber: number, seatNumber: number } => {
    // Use external finder if provided
    if (findNextAvailableSeat) {
      const assignment = findNextAvailableSeat();
      // Double-check for conflicts even with the provided function
      if (assignment && !checkSeatConflict(assignment.tableNumber, assignment.seatNumber)) {
        return assignment;
      }
      // If there's a conflict, fall back to manual assignment
    }
    
    // If no external finder provided or it resulted in conflict, use enhanced logic
    const tableOccupancy = getTableOccupancy();
    const tableNumbers = Object.keys(tableOccupancy).map(Number);
    
    // If we have multiple tables, consider random assignment
    if (tableNumbers.length > 1) {
      // Find tables that aren't full (less than 9 players)
      const availableTables = tableNumbers.filter(tableNum => 
        tableOccupancy[tableNum] < 9
      );
      
      if (availableTables.length > 0) {
        // Randomly select one of the available tables
        const randomTableIndex = Math.floor(Math.random() * availableTables.length);
        const selectedTableNumber = availableTables[randomTableIndex];
        
        // Find an available seat at the selected table
        const occupiedSeats = new Set<number>();
        players.forEach(player => {
          if (player.status === 'active' && player.tableNumber === selectedTableNumber) {
            occupiedSeats.add(player.seatNumber);
          }
        });
        
        // Find first available seat at selected table
        for (let seat = 1; seat <= 9; seat++) {
          if (!occupiedSeats.has(seat)) {
            console.log(`Randomly assigned to table ${selectedTableNumber}, seat ${seat}`);
            return { tableNumber: selectedTableNumber, seatNumber: seat };
          }
        }
      }
    }
    
    // Fall back to regular logic if random assignment didn't work
    // Find the first table with an available seat
    const tablesWithPlayers = new Map<number, Set<number>>();
    
    players.forEach(player => {
      if (player.status === 'active' && player.tableNumber > 0) {
        if (!tablesWithPlayers.has(player.tableNumber)) {
          tablesWithPlayers.set(player.tableNumber, new Set<number>());
        }
        tablesWithPlayers.get(player.tableNumber)!.add(player.seatNumber);
      }
    });
    
    // Try to find an open seat at an existing table
    for (const [tableNumber, occupiedSeats] of tablesWithPlayers.entries()) {
      for (let seat = 1; seat <= 10; seat++) {
        if (!occupiedSeats.has(seat)) {
          return { tableNumber, seatNumber: seat };
        }
      }
    }
    
    // If no open seats, create a new table
    const newTableNumber = tableNumbers.length > 0 ? Math.max(...tableNumbers) + 1 : 1;
    return { tableNumber: newTableNumber, seatNumber: 1 };
  };
  
  // Register a new player
  const registerPlayer = async () => {
    if (!newPlayerName.trim()) {
      setFormError('Player name is required');
      return;
    }
    
    setFormError('');
    setLoading(true);
    const playerId = `P${tournamentId}-${Date.now()}`;
    
    // Determine table and seat
    let tableNumber = Number(newPlayerTable) || 0;
    let seatNumber = Number(newPlayerSeat) || 0;
    
    // If table or seat is not provided or there's a conflict, auto-assign
    if (tableNumber <= 0 || seatNumber <= 0 || checkSeatConflict(tableNumber, seatNumber)) {
      const assignment = autoAssignTableSeat();
      tableNumber = assignment.tableNumber;
      seatNumber = assignment.seatNumber;
    }
    
    const newPlayer: Player = {
      id: playerId,
      name: newPlayerName.trim(),
      email: newPlayerEmail.trim() || undefined,
      tableNumber,
      seatNumber,
      chips: startingChips,
      status: 'active',
      rebuys: 0,
      addOns: 0,
    };
    
    try {
      // Store player in localStorage
      savePlayer(newPlayer, tournamentId);
      
      const updatedPlayers = [...players, newPlayer];
      setPlayers(updatedPlayers);
      onPlayerUpdate(updatedPlayers);
      
      // Reset form
      setNewPlayerName('');
      setNewPlayerEmail('');
      setNewPlayerTable('');
      setNewPlayerSeat('');
    } catch (err) {
      console.error('Error registering player:', err);
      setFormError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update player chips
  const updateChips = async (playerId: string, newChipCount: number) => {
    try {
      // Update local state
      const updatedPlayers = players.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            chips: newChipCount
          };
        }
        return player;
      });
      
      // Save to localStorage
      const playerToUpdate = updatedPlayers.find(p => p.id === playerId);
      if (playerToUpdate) {
        savePlayer(playerToUpdate, tournamentId);
      }
      
      setPlayers(updatedPlayers);
      onPlayerUpdate(updatedPlayers);
    } catch (err) {
      console.error('Error updating player chips:', err);
    }
  };
  
  // Perform rebuy for a player
  const performRebuy = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Check if player has already reached max rebuys
    if (maxRebuys > 0 && player.rebuys >= maxRebuys) {
      return;
    }
    
    const newRebuyCount = player.rebuys + 1;
    const newChipCount = player.chips + rebuyChips;
    
    try {
      // Update local state
      const updatedPlayers = players.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            chips: newChipCount,
            rebuys: newRebuyCount
          };
        }
        return p;
      });
      
      // Save to localStorage
      const playerToUpdate = updatedPlayers.find(p => p.id === playerId);
      if (playerToUpdate) {
        savePlayer(playerToUpdate, tournamentId);
      }
      
      setPlayers(updatedPlayers);
      onPlayerUpdate(updatedPlayers);
    } catch (err) {
      console.error('Error performing rebuy:', err);
    }
  };
  
  // Perform add-on for a player
  const performAddOn = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    const newAddOnCount = player.addOns + 1;
    const newChipCount = player.chips + addOnChips;
    
    try {
      // Update local state
      const updatedPlayers = players.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            chips: newChipCount,
            addOns: newAddOnCount
          };
        }
        return p;
      });
      
      // Save to localStorage
      const playerToUpdate = updatedPlayers.find(p => p.id === playerId);
      if (playerToUpdate) {
        savePlayer(playerToUpdate, tournamentId);
      }
      
      setPlayers(updatedPlayers);
      onPlayerUpdate(updatedPlayers);
    } catch (err) {
      console.error('Error performing add-on:', err);
    }
  };
  
  // Eliminate a player
  const eliminatePlayer = async (playerId: string) => {
    // Calculate finish position (players still active + 1)
    const activePlayerCount = players.filter(p => p.status === 'active').length;
    const finishPosition = activePlayerCount;
    
    try {
      // Update local state
      const updatedPlayers = players.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            status: 'eliminated' as const,
            finishPosition,
            chips: 0,
          };
        }
        return player;
      });
      
      // Save to localStorage
      const playerToUpdate = updatedPlayers.find(p => p.id === playerId);
      if (playerToUpdate) {
        savePlayer(playerToUpdate, tournamentId);
      }
      
      setPlayers(updatedPlayers);
      onPlayerUpdate(updatedPlayers);
    } catch (err) {
      console.error('Error eliminating player:', err);
    }
  };
  
  // Update player table and seat
  const updateTableSeat = async (playerId: string, tableNumber: number, seatNumber: number) => {
    // Don't allow invalid table or seat numbers
    if (tableNumber <= 0 || seatNumber <= 0) {
      return;
    }
    
    // Check for seat conflicts (same table & seat)
    if (checkSeatConflict(tableNumber, seatNumber, playerId)) {
      // Automatically find next available seat at that table
      const availableSeats = new Set<number>();
      for (let seat = 1; seat <= 10; seat++) {
        if (!checkSeatConflict(tableNumber, seat, playerId)) {
          availableSeats.add(seat);
        }
      }
      
      if (availableSeats.size > 0) {
        seatNumber = Math.min(...Array.from(availableSeats));
      } else {
        // No seats available at this table, try finding another table
        const assignment = autoAssignTableSeat();
        tableNumber = assignment.tableNumber;
        seatNumber = assignment.seatNumber;
      }
    }
    
    try {
      // Update local state
      const updatedPlayers = players.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            tableNumber,
            seatNumber,
          };
        }
        return player;
      });
      
      // Save to localStorage
      const playerToUpdate = updatedPlayers.find(p => p.id === playerId);
      if (playerToUpdate) {
        savePlayer(playerToUpdate, tournamentId);
      }
      
      setPlayers(updatedPlayers);
      onPlayerUpdate(updatedPlayers);
    } catch (err) {
      console.error('Error updating player table/seat:', err);
    }
  };
  
  // Filter and sort players
  const filteredPlayers = players
    .filter(player => {
      // Apply search filter
      const nameMatch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = player.email ? player.email.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      
      // Apply status filter
      const statusMatch = statusFilter === 'all' || player.status === statusFilter;
      
      return (nameMatch || emailMatch) && statusMatch;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'chips') {
        return sortDirection === 'asc' 
          ? a.chips - b.chips
          : b.chips - a.chips;
      } else if (sortBy === 'table') {
        if (a.tableNumber === b.tableNumber) {
          return a.seatNumber - b.seatNumber;
        }
        return sortDirection === 'asc' 
          ? a.tableNumber - b.tableNumber
          : b.tableNumber - a.tableNumber;
      }
      return 0;
    });
  
  // Toggle sort direction
  const toggleSort = (column: 'name' | 'chips' | 'table') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Register New Player Form */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white/5 backdrop-blur-sm p-6 rounded-lg shadow-xl mb-6 border border-white/10"
      >
        <h2 className="text-lg font-bold mb-4">Register New Player</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Player Name</label>
            <input 
              type="text"
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name"
              disabled={loading}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">Email (optional)</label>
            <input 
              type="email"
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={newPlayerEmail}
              onChange={(e) => setNewPlayerEmail(e.target.value)}
              placeholder="Enter player email"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Table # (optional)</label>
            <input 
              type="number"
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={newPlayerTable}
              onChange={(e) => setNewPlayerTable(e.target.value ? Number(e.target.value) : '')}
              placeholder="Auto-assign"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Seat # (optional)</label>
            <input 
              type="number"
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              value={newPlayerSeat}
              onChange={(e) => setNewPlayerSeat(e.target.value ? Number(e.target.value) : '')}
              placeholder="Auto-assign"
              disabled={loading}
            />
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={registerPlayer}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </div>
        
        {formError && (
          <div className="mt-3 text-red-400 text-sm">{formError}</div>
        )}
      </motion.div>
      
      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 mb-4"
      >
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search players..."
            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('eliminated')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'eliminated' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Eliminated
          </button>
          <button
            onClick={() => setStatusFilter('final-table')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'final-table' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Final Table
          </button>
        </div>
      </motion.div>
      
      {/* Players Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 shadow-xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="bg-black/30 border-b border-white/10">
                <th 
                  className="text-left p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center">
                    <span>Player</span>
                    {sortBy === 'name' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left p-4">Email</th>
                <th 
                  className="text-left p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleSort('table')}
                >
                  <div className="flex items-center">
                    <span>Table/Seat</span>
                    {sortBy === 'table' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleSort('chips')}
                >
                  <div className="flex items-center">
                    <span>Chips</span>
                    {sortBy === 'chips' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left p-4">Rebuys/Add-ons</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-400">
                    No players found. Register players to get started.
                  </td>
                </tr>
              ) :
                filteredPlayers.map((player) => (
                  <tr 
                    key={player.id} 
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          player.status === 'active' 
                            ? 'bg-green-500' 
                            : player.status === 'final-table'
                              ? 'bg-blue-500'
                              : 'bg-red-500'
                        }`} />
                        {player.name}
                      </div>
                    </td>
                    <td className="p-4">
                      {player.email || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="p-4">
                      {player.status === 'eliminated' ? (
                        <span className="text-gray-400">
                          {player.finishPosition ? `Finished: ${player.finishPosition}${getOrdinalSuffix(player.finishPosition)}` : 'Eliminated'}
                        </span>
                      ) : (
                        <div className="flex items-center">
                          <input 
                            type="number"
                            min="1"
                            className="w-16 bg-white/10 border border-white/20 rounded-lg p-2 mr-1 text-white"
                            value={player.tableNumber || ''}
                            onChange={(e) => updateTableSeat(player.id, Number(e.target.value), player.seatNumber)}
                            placeholder="Table"
                          />
                          <span className="mx-1 text-gray-400">/</span>
                          <input 
                            type="number"
                            min="1"
                            className="w-14 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                            value={player.seatNumber || ''}
                            onChange={(e) => updateTableSeat(player.id, player.tableNumber, Number(e.target.value))}
                            placeholder="Seat"
                          />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {player.status === 'eliminated' ? (
                        <span className="text-gray-400">0</span>
                      ) : (
                        <input 
                          type="number"
                          className="w-28 bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                          value={player.chips}
                          onChange={(e) => updateChips(player.id, Number(e.target.value))}
                        />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <span className="text-gray-400">Rebuys:</span> {player.rebuys}
                        </div>
                        <div className="text-sm ml-2">
                          <span className="text-gray-400">Add-ons:</span> {player.addOns}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {player.status !== 'eliminated' && (
                          <>
                            {allowRebuys && (maxRebuys === 0 || player.rebuys < maxRebuys) && (
                              <button
                                onClick={() => performRebuy(player.id)}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs py-1 px-2 rounded transition-colors"
                              >
                                Rebuy
                              </button>
                            )}
                            
                            {allowAddOns && (
                              <button
                                onClick={() => performAddOn(player.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
                              >
                                Add-on
                              </button>
                            )}
                            
                            <button
                              onClick={() => eliminatePlayer(player.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors"
                            >
                              Eliminate
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerManager; 