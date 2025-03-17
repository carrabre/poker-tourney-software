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
}

const TableManager: React.FC<TableManagerProps> = ({
  players,
  maxPlayersPerTable = 9,
  onPlayersUpdate,
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [autoBalanceThreshold, setAutoBalanceThreshold] = useState<number>(2);
  const [isPendingRedraw, setIsPendingRedraw] = useState(false);
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  
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
  
  const createNewTable = () => {
    // Find highest table number
    const highestTableNumber = Math.max(...tables.map(t => t.tableNumber), 0);
    const newTableNumber = highestTableNumber + 1;
    
    // Add new table to state
    setTables(prev => [
      ...prev,
      {
        tableNumber: newTableNumber,
        maxSeats: maxPlayersPerTable,
        activePlayers: 0,
        isBreaking: false
      }
    ]);
  };
  
  // Get all active tables from players data
  const getActiveTables = () => {
    const tables = new Set<number>();
    
    players.forEach(player => {
      if (player.status === 'active' && player.tableNumber) {
        tables.add(player.tableNumber);
      }
    });
    
    return Array.from(tables).sort((a, b) => a - b);
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
  
  // Complete redraw of tables and seats
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
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          onClick={autoBalanceTables}
        >
          Auto-Balance Tables
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          onClick={completeRedraw}
        >
          Complete Redraw
        </motion.button>
        
        {tableWithFewestPlayers && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
            onClick={() => breakTable(tableWithFewestPlayers)}
          >
            Break Table {tableWithFewestPlayers} ({getPlayersAtTable(tableWithFewestPlayers).length} players)
          </motion.button>
        )}
      </div>
      
      {/* Tables */}
      <div className="space-y-6">
        {activeTables.length === 0 ? (
          <div className="bg-gray-800 dark:bg-black/40 rounded-lg p-6 text-center text-gray-400">
            No active tables. Add players to create tables.
          </div>
        ) : (
          activeTables.map(tableId => (
            <motion.div
              key={tableId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white dark:bg-black/40 rounded-xl shadow-lg overflow-hidden border ${
                activeTableId === tableId 
                  ? 'border-blue-500' 
                  : 'border-transparent'
              }`}
            >
              <div 
                className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center cursor-pointer"
                onClick={() => setActiveTableId(activeTableId === tableId ? null : tableId)}
              >
                <h3 className="font-bold">
                  Table {tableId} ({getPlayersAtTable(tableId).length} players)
                </h3>
                <span className="text-gray-500">
                  {activeTableId === tableId ? '↑ Collapse' : '↓ Expand'}
                </span>
              </div>
              
              {activeTableId === tableId && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: maxPlayersPerTable }, (_, i) => {
                      const seatNumber = i + 1;
                      const player = players.find(
                        p => p.status === 'active' && p.tableNumber === tableId && p.seatNumber === seatNumber
                      );
                      
                      return (
                        <div 
                          key={seatNumber}
                          className={`border rounded-lg p-3 ${
                            player 
                              ? 'bg-gray-100 dark:bg-gray-800 border-blue-200 dark:border-blue-900' 
                              : 'border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Seat {seatNumber}
                          </div>
                          <div className="font-medium">
                            {player ? player.name : 'Empty'}
                          </div>
                          {player && (
                            <div className="flex justify-between mt-2 text-sm">
                              <div className="text-gray-500 dark:text-gray-400">
                                {player.chips.toLocaleString()} chips
                              </div>
                              <div className="flex gap-1">
                                {activeTables.filter(id => id !== tableId).map(otherTableId => (
                                  <button
                                    key={otherTableId}
                                    className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                                    onClick={() => movePlayerToTable(player.id, otherTableId)}
                                  >
                                    →{otherTableId}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TableManager; 