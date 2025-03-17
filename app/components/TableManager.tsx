'use client';

import React, { useState, useEffect } from 'react';
import { Player } from '@/app/types';
import { motion } from 'framer-motion';

interface Table {
  tableNumber: number;
  maxSeats: number;
  activePlayers: number;
  isBreaking: boolean;
}

interface TableManagerProps {
  players: Player[];
  maxPlayersPerTable: number;
  onPlayersUpdate: (updatedPlayers: Player[]) => void;
  onDeleteTable?: (tableNumber: number) => void;
}

const TableManager: React.FC<TableManagerProps> = ({
  players,
  maxPlayersPerTable = 9,
  onPlayersUpdate,
  onDeleteTable
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [autoBalanceThreshold, setAutoBalanceThreshold] = useState<number>(2);
  const [isPendingRedraw, setIsPendingRedraw] = useState(false);
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [newTableMaxSeats, setNewTableMaxSeats] = useState<number>(9);
  
  // Process players to get table information
  useEffect(() => {
    // Get all active players
    const activePlayers = players.filter(p => p.status === 'active');
    
    // Get unique table numbers
    const tableNumbers = [...new Set(activePlayers.map(p => p.tableNumber))]
      .filter(n => n > 0)
      .sort((a, b) => a - b);
    
    // Create table objects
    const tableData: Table[] = tableNumbers.map(tableNumber => {
      const playersAtTable = activePlayers.filter(p => p.tableNumber === tableNumber);
      
      return {
        tableNumber,
        maxSeats: maxPlayersPerTable,
        activePlayers: playersAtTable.length,
        isBreaking: false
      };
    });
    
    setTables(tableData);
  }, [players, maxPlayersPerTable]);
  
  // Calculate table balance status
  const calculateTableImbalance = (): { isBalanced: boolean; tablesNeedingPlayers: Table[] } => {
    if (tables.length <= 1) {
      return { isBalanced: true, tablesNeedingPlayers: [] };
    }
    
    // Find min and max players at tables
    const minPlayers = Math.min(...tables.map(t => t.activePlayers));
    const maxPlayers = Math.max(...tables.map(t => t.activePlayers));
    
    // Find tables that need players
    const tablesNeedingPlayers = tables.filter(
      table => table.activePlayers === minPlayers && 
      maxPlayers - minPlayers > autoBalanceThreshold
    );
    
    return { 
      isBalanced: maxPlayers - minPlayers <= autoBalanceThreshold,
      tablesNeedingPlayers
    };
  };
  
  const tableBalance = calculateTableImbalance();
  
  // Mark a table for breaking
  const markTableForBreak = (tableNumber: number) => {
    setTables(prevTables => 
      prevTables.map(table => 
        table.tableNumber === tableNumber
          ? { ...table, isBreaking: true }
          : table
      )
    );
  };
  
  // Auto-balance tables to ensure even distribution of players
  const autoBalanceTables = () => {
    // Get active tables
    const activeTables = Array.from(new Set(
      players
        .filter(p => p.status === 'active')
        .map(p => p.tableNumber)
    )).filter(Boolean);
    
    if (activeTables.length < 2) {
      alert('Need at least 2 active tables to balance');
      return;
    }
    
    // Create a deep copy of the players array
    const updatedPlayers = [...players];
    
    // Track assigned seats for each table
    const assignedSeats = new Map<number, Set<number>>();
    
    // Initialize seat assignments
    updatedPlayers.forEach(player => {
      if (player.status === 'active' && player.tableNumber && player.seatNumber) {
        const tableSeats = assignedSeats.get(player.tableNumber) || new Set<number>();
        tableSeats.add(player.seatNumber);
        assignedSeats.set(player.tableNumber, tableSeats);
      }
    });
    
    // Count active players
    const activePlayers = updatedPlayers.filter(p => p.status === 'active').length;
    
    // Calculate ideal count per table
    const idealCountPerTable = Math.ceil(activePlayers / activeTables.length);
    
    // Balance tables
    let madeChanges = true;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops
    
    while (madeChanges && iterations < maxIterations) {
      madeChanges = false;
      iterations++;
      
      // Recalculate table counts
      const currentTableCounts: Record<number, number> = {};
      activeTables.forEach(tableId => {
        currentTableCounts[tableId] = updatedPlayers.filter(
          p => p.status === 'active' && p.tableNumber === tableId
        ).length;
      });
      
      // Find tables that need balancing
      const overfilledTables: number[] = [];
      const underfilledTables: number[] = [];
      
      activeTables.forEach(tableId => {
        const count = currentTableCounts[tableId];
        if (count > idealCountPerTable) {
          overfilledTables.push(tableId);
        } else if (count < idealCountPerTable - 1) { // Allow a difference of 1
          underfilledTables.push(tableId);
        }
      });
      
      // Balance one player at a time
      for (const fromTableId of overfilledTables) {
        for (const toTableId of underfilledTables) {
          if (currentTableCounts[fromTableId] > idealCountPerTable && 
              currentTableCounts[toTableId] < idealCountPerTable) {
            
            // Find players at the overfilled table
            const playersToMove = updatedPlayers.filter(
              p => p.status === 'active' && p.tableNumber === fromTableId
            );
            
            // Get the last player to arrive at the table (highest seat number typically)
            if (playersToMove.length > 0) {
              // Sort by seat number to move the last arrival
              playersToMove.sort((a, b) => (b.seatNumber || 0) - (a.seatNumber || 0));
              const playerToMove = playersToMove[0];
              
              // Find next available seat at the destination table
              const takenSeats = assignedSeats.get(toTableId) || new Set<number>();
              let nextSeat = 1;
              while (takenSeats.has(nextSeat)) {
                nextSeat++;
              }
              
              // Move the player
              const playerIndex = updatedPlayers.findIndex(p => p.id === playerToMove.id);
              if (playerIndex !== -1) {
                // Remove from old seat
                const oldSeat = updatedPlayers[playerIndex].seatNumber || 0;
                const oldTable = updatedPlayers[playerIndex].tableNumber || 0;
                const oldTableSeats = assignedSeats.get(oldTable) || new Set<number>();
                oldTableSeats.delete(oldSeat);
                assignedSeats.set(oldTable, oldTableSeats);
                
                // Add to new seat
                updatedPlayers[playerIndex] = {
                  ...updatedPlayers[playerIndex],
                  tableNumber: toTableId,
                  seatNumber: nextSeat
                };
                
                takenSeats.add(nextSeat);
                assignedSeats.set(toTableId, takenSeats);
                
                // Update counts
                currentTableCounts[fromTableId]--;
                currentTableCounts[toTableId]++;
                
                madeChanges = true;
                break;
              }
            }
          }
        }
        if (madeChanges) break; // Only move one player at a time
      }
    }
    
    onPlayersUpdate(updatedPlayers);
  };
  
  // Break a table and redistribute players
  const breakTable = (tableNumber: number) => {
    if (!tableNumber) return;
    
    // Create a deep copy of the players array
    const playersCopy = [...players];
    
    // Get players at the breaking table
    const playersToMove = playersCopy
      .filter(p => p.tableNumber === tableNumber && p.status === 'active');
    
    if (playersToMove.length === 0) return;
    
    // Get tables that will receive players
    const targetTables = tables
      .filter(t => t.tableNumber !== tableNumber)
      .sort((a, b) => a.activePlayers - b.activePlayers);
    
    if (targetTables.length === 0) return;
    
    // Distribute players among tables
    let currentTableIndex = 0;
    
    for (const player of playersToMove) {
      const targetTable = targetTables[currentTableIndex];
      
      // Find available seat at target table
      const occupiedSeats = new Set(
        playersCopy
          .filter(p => p.tableNumber === targetTable.tableNumber && p.status === 'active')
          .map(p => p.seatNumber)
      );
      
      let newSeat = 1;
      while (occupiedSeats.has(newSeat) && newSeat <= maxPlayersPerTable) {
        newSeat++;
      }
      
      // Update player's table and seat
      const playerIndex = playersCopy.findIndex(p => p.id === player.id);
      if (playerIndex >= 0) {
        playersCopy[playerIndex] = {
          ...playersCopy[playerIndex],
          tableNumber: targetTable.tableNumber,
          seatNumber: newSeat
        };
      }
      
      // Move to next table (round-robin)
      currentTableIndex = (currentTableIndex + 1) % targetTables.length;
    }
    
    // Update players
    onPlayersUpdate(playersCopy);
    
    // Remove the broken table from state
    setTables(prev => prev.filter(t => t.tableNumber !== tableNumber));
    setSelectedTable(null);
  };
  
  // Enhanced create new table function
  const createNewTable = () => {
    // Find highest table number
    const highestTableNumber = Math.max(...tables.map(t => t.tableNumber), 0);
    const newTableNumber = highestTableNumber + 1;
    
    // Add new table to state
    setTables(prev => [
      ...prev,
      {
        tableNumber: newTableNumber,
        maxSeats: newTableMaxSeats,
        activePlayers: 0,
        isBreaking: false
      }
    ]);
    
    // Show confirmation
    alert(`Table ${newTableNumber} has been created with ${newTableMaxSeats} seats`);
  };
  
  // Get all active tables from players data
  const getActiveTables = () => {
    // Start with tables from players data
    const activeTableSet = new Set<number>();
    
    // Add tables with players
    players.forEach(player => {
      if (player.status === 'active' && player.tableNumber) {
        activeTableSet.add(player.tableNumber);
      }
    });
    
    // Add tables from our tables state, which includes empty tables
    tables.forEach(table => {
      activeTableSet.add(table.tableNumber);
    });
    
    return Array.from(activeTableSet).sort((a, b) => a - b);
  };
  
  const activeTables = getActiveTables();
  
  // Calculate players per table
  const getPlayersAtTable = (tableNumber: number) => {
    return players.filter(
      player => player.status === 'active' && player.tableNumber === tableNumber
    );
  };
  
  // Find the next available seat at a table
  const findNextAvailableSeat = (tableId: number) => {
    // Get all taken seats at this table
    const takenSeats = new Set<number>();
    
    players.forEach(player => {
      if (player.status === 'active' && player.tableNumber === tableId) {
        takenSeats.add(player.seatNumber);
      }
    });
    
    // Find first available seat
    for (let seat = 1; seat <= maxPlayersPerTable; seat++) {
      if (!takenSeats.has(seat)) {
        return seat;
      }
    }
    
    return null; // No seats available
  };
  
  // Move a player to another table
  const movePlayerToTable = (playerId: string, targetTableId: number) => {
    const nextSeat = findNextAvailableSeat(targetTableId);
    
    if (nextSeat === null) {
      alert(`Table ${targetTableId} is full. Cannot move player.`);
      return;
    }
    
    const updatedPlayers = players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          tableNumber: targetTableId,
          seatNumber: nextSeat
        };
      }
      return player;
    });
    
    onPlayersUpdate(updatedPlayers);
  };
  
  // Updated random seating assignment function
  const completeRedraw = () => {
    // Confirm with the user
    if (!confirm("Are you sure you want to redraw all table and seat assignments?")) {
      return;
    }
    
    // Get active players
    const activePlayers = players.filter(p => p.status === 'active');
    
    // Shuffle the players (Fisher-Yates algorithm)
    const shuffledPlayers = [...activePlayers];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
    
    // Calculate how many tables we need
    const tableCount = Math.ceil(shuffledPlayers.length / maxPlayersPerTable);
    
    // Assign players to tables and seats
    const updatedPlayers = [...players];
    
    // Clear existing table assignments for active players
    updatedPlayers.forEach((player, index) => {
      if (player.status === 'active') {
        updatedPlayers[index] = {
          ...player,
          tableNumber: 0,
          seatNumber: 0
        };
      }
    });
    
    // Create a map to track assigned seats per table
    const assignedSeats = new Map<number, Set<number>>();
    for (let i = 1; i <= tableCount; i++) {
      assignedSeats.set(i, new Set<number>());
    }
    
    // Assign new table and seat numbers
    shuffledPlayers.forEach((player) => {
      // Find this player in the updated array
      const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
      if (playerIndex === -1) return;
      
      // Find a table with the fewest players
      let targetTable = 1;
      let minPlayers = Infinity;
      
      for (let tableId = 1; tableId <= tableCount; tableId++) {
        const tablePlayers = assignedSeats.get(tableId)?.size || 0;
        if (tablePlayers < minPlayers) {
          minPlayers = tablePlayers;
          targetTable = tableId;
        }
      }
      
      // Find the next available seat at that table
      let targetSeat = 1;
      const takenSeats = assignedSeats.get(targetTable) || new Set<number>();
      
      while (takenSeats.has(targetSeat)) {
        targetSeat++;
      }
      
      // Assign the player to this table and seat
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        tableNumber: targetTable,
        seatNumber: targetSeat
      };
      
      // Mark this seat as taken
      takenSeats.add(targetSeat);
      assignedSeats.set(targetTable, takenSeats);
    });
    
    onPlayersUpdate(updatedPlayers);
  };
  
  // Get the table with fewest players (for break table UI)
  const getTableWithFewestPlayers = () => {
    if (activeTables.length <= 1) return null;
    
    let minTable = activeTables[0];
    let minCount = getPlayersAtTable(minTable).length;
    
    for (const tableId of activeTables) {
      const count = getPlayersAtTable(tableId).length;
      if (count < minCount) {
        minTable = tableId;
        minCount = count;
      }
    }
    
    return minTable;
  };
  
  const tableWithFewestPlayers = getTableWithFewestPlayers();
  
  return (
    <div className="space-y-8">
      {/* Action buttons with enhanced create table section */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <h2 className="text-xl font-bold mb-4">Table Management Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Table Section */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <h3 className="font-semibold mb-3">Create New Table</h3>
            <div className="flex items-center gap-3 mb-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Number of Seats</label>
                <input 
                  type="number" 
                  min="2" 
                  max="10"
                  value={newTableMaxSeats}
                  onChange={(e) => setNewTableMaxSeats(Math.min(10, Math.max(2, parseInt(e.target.value) || 9)))}
                  className="bg-gray-700 border border-gray-600 rounded w-20 px-2 py-1"
                />
              </div>
              <button
                className="mt-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                onClick={createNewTable}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Table
              </button>
            </div>
          </div>
          
          {/* Balance Tables Section */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
            <h3 className="font-semibold mb-3">Table Balance & Redraw</h3>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={autoBalanceTables}
              >
                Auto-Balance Tables
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={completeRedraw}
              >
                Complete Redraw
              </motion.button>
              
              {tableWithFewestPlayers && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  onClick={() => breakTable(tableWithFewestPlayers)}
                >
                  Break Table {tableWithFewestPlayers} ({getPlayersAtTable(tableWithFewestPlayers).length} players)
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tables with enhanced visual design */}
      <div className="space-y-6">
        {activeTables.length === 0 ? (
          <div className="bg-gray-800 dark:bg-black/40 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4 opacity-30">🎮</div>
            <h3 className="text-xl font-semibold mb-2">No Active Tables</h3>
            <p className="text-gray-400 mb-4">Add players or create tables to get started</p>
            <button
              onClick={createNewTable}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create First Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTables.map(tableId => (
              <motion.div
                key={tableId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border ${
                  activeTableId === tableId 
                    ? 'border-blue-500 ring-2 ring-blue-500/30' 
                    : 'border-gray-700/50'
                }`}
              >
                <div 
                  className="p-4 border-b border-gray-700/50 flex justify-between items-center"
                >
                  <div className="flex items-center cursor-pointer" onClick={() => setActiveTableId(activeTableId === tableId ? null : tableId)}>
                    <div className="bg-green-500/20 text-green-500 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      {tableId}
                    </div>
                    <h3 className="font-bold text-lg">
                      Table {tableId}
                      <span className="ml-2 text-sm text-gray-400">
                        ({getPlayersAtTable(tableId).length} players)
                      </span>
                    </h3>
                  </div>
                  <div className="flex items-center">
                    {/* Delete Table button */}
                    {onDeleteTable && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (getPlayersAtTable(tableId).length === 0) {
                            if (window.confirm(`Are you sure you want to delete Table ${tableId}?`)) {
                              onDeleteTable(tableId);
                            }
                          } else {
                            alert(`Cannot delete table with active players. Move players to another table first.`);
                          }
                        }}
                        className={`text-red-400 hover:text-red-300 transition-colors mr-4 ${getPlayersAtTable(tableId).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={getPlayersAtTable(tableId).length > 0 ? 
                          "Cannot delete table with active players" : 
                          "Delete this table"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Show/Hide button */}
                    <div className="flex items-center cursor-pointer" onClick={() => setActiveTableId(activeTableId === tableId ? null : tableId)}>
                      <span className="text-gray-500 mr-2">
                        {activeTableId === tableId ? 'Hide' : 'Show'}
                      </span>
                      <div className={`transform transition-transform ${activeTableId === tableId ? 'rotate-180' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {activeTableId === tableId && (
                  <div className="p-6">
                    {/* Visual table representation */}
                    <div className="relative mb-8 mx-auto p-2">
                      <div className="w-full h-[300px] bg-emerald-900/30 border-8 border-amber-800/30 rounded-[50%] relative flex items-center justify-center">
                        <div className="text-sm text-gray-400 font-medium">Table {tableId}</div>
                        
                        {/* Seats around the table - using a circular arrangement */}
                        {Array.from({ length: maxPlayersPerTable }, (_, i) => {
                          const seatNumber = i + 1;
                          const player = players.find(
                            p => p.status === 'active' && p.tableNumber === tableId && p.seatNumber === seatNumber
                          );
                          
                          // Calculate position around the circle
                          const angle = (2 * Math.PI * i) / maxPlayersPerTable;
                          const radius = 120; // distance from center
                          const top = 150 - Math.sin(angle) * radius;
                          const left = 150 + Math.cos(angle) * radius;
                          
                          return (
                            <div 
                              key={seatNumber}
                              style={{
                                position: 'absolute',
                                top: `${top}px`,
                                left: `${left}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all ${
                                player 
                                  ? 'bg-blue-700 border-2 border-blue-500 shadow-lg' 
                                  : 'bg-gray-800/60 border border-gray-700'
                              }`}
                            >
                              <div className="text-xs font-bold mb-0.5">Seat {seatNumber}</div>
                              <div className="text-xs truncate max-w-[56px] text-center">
                                {player ? player.name.split(' ')[0] : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Players list */}
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                      <h4 className="font-medium mb-3">Players at Table {tableId}</h4>
                      <div className="overflow-x-auto">
                        {getPlayersAtTable(tableId).length > 0 ? (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-700">
                                <th className="text-left p-2">Seat</th>
                                <th className="text-left p-2">Name</th>
                                <th className="text-left p-2">Chips</th>
                                <th className="text-left p-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getPlayersAtTable(tableId)
                                .sort((a, b) => a.seatNumber - b.seatNumber)
                                .map(player => (
                                  <tr key={player.id} className="border-b border-gray-700/50">
                                    <td className="p-2">{player.seatNumber}</td>
                                    <td className="p-2 font-medium">{player.name}</td>
                                    <td className="p-2">{player.chips.toLocaleString()}</td>
                                    <td className="p-2">
                                      <div className="flex gap-1">
                                        {activeTables.filter(id => id !== tableId).map(otherTableId => (
                                          <button 
                                            key={otherTableId}
                                            className="text-xs px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                            onClick={() => movePlayerToTable(player.id, otherTableId)}
                                          >
                                            Move to {otherTableId}
                                          </button>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            No players at this table
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableManager; 