'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BlindLevel {
  small: number;
  big: number;
  ante?: number;
  bringIn?: number;
  duration: number; // in minutes
}

const NewTournament = () => {
  const [tournamentName, setTournamentName] = useState('');
  const [buyIn, setBuyIn] = useState(100);
  const [startingChips, setStartingChips] = useState(10000);
  const [levelDuration, setLevelDuration] = useState(20);
  const [blindLevels, setBlindLevels] = useState<BlindLevel[]>([
    { small: 25, big: 50, ante: 0, bringIn: 0, duration: 20 },
    { small: 50, big: 100, ante: 0, bringIn: 0, duration: 20 },
    { small: 75, big: 150, ante: 0, bringIn: 0, duration: 20 },
    { small: 100, big: 200, ante: 25, bringIn: 0, duration: 20 },
    { small: 150, big: 300, ante: 25, bringIn: 0, duration: 20 },
    { small: 200, big: 400, ante: 50, bringIn: 0, duration: 20 },
    { small: 250, big: 500, ante: 50, bringIn: 0, duration: 20 },
    { small: 300, big: 600, ante: 75, bringIn: 0, duration: 20 },
    { small: 400, big: 800, ante: 100, bringIn: 0, duration: 20 },
    { small: 500, big: 1000, ante: 100, bringIn: 0, duration: 20 },
    { small: 600, big: 1200, ante: 200, bringIn: 0, duration: 20 },
    { small: 800, big: 1600, ante: 200, bringIn: 0, duration: 20 },
    { small: 1000, big: 2000, ante: 300, bringIn: 0, duration: 20 },
    { small: 1500, big: 3000, ante: 400, bringIn: 0, duration: 20 },
    { small: 2000, big: 4000, ante: 500, bringIn: 0, duration: 20 },
    { small: 2500, big: 5000, ante: 500, bringIn: 0, duration: 20 },
    { small: 3000, big: 6000, ante: 1000, bringIn: 0, duration: 20 },
    { small: 4000, big: 8000, ante: 1000, bringIn: 0, duration: 20 },
    { small: 5000, big: 10000, ante: 1000, bringIn: 0, duration: 20 },
    { small: 6000, big: 12000, ante: 2000, bringIn: 0, duration: 20 },
  ]);
  const [breakInterval, setBreakInterval] = useState(4);
  const [breakDuration, setBreakDuration] = useState(15);
  const [selectedPayoutStructure, setSelectedPayoutStructure] = useState('standard');
  const [lateRegistration, setLateRegistration] = useState(6);

  // Add a new blind level
  const addBlindLevel = () => {
    const lastLevel = blindLevels[blindLevels.length - 1];
    const newSmall = lastLevel.small * 1.5;
    const newBig = lastLevel.big * 1.5;
    const newAnte = lastLevel.ante ? lastLevel.ante * 1.5 : 0;
    
    setBlindLevels([
      ...blindLevels,
      {
        small: Math.round(newSmall / 100) * 100, // Round to nearest 100
        big: Math.round(newBig / 100) * 100,
        ante: Math.round(newAnte / 50) * 50, // Round to nearest 50
        bringIn: 0,
        duration: levelDuration
      }
    ]);
  };

  // Remove last blind level
  const removeBlindLevel = () => {
    if (blindLevels.length > 1) {
      setBlindLevels(blindLevels.slice(0, -1));
    }
  };

  // Update a specific blind level
  const updateBlindLevel = (index: number, field: keyof BlindLevel, value: number) => {
    const updatedLevels = [...blindLevels];
    updatedLevels[index] = {
      ...updatedLevels[index],
      [field]: value
    };
    setBlindLevels(updatedLevels);
  };

  // Handle tournament creation
  const handleCreateTournament = () => {
    // In a real app, this would save the tournament data to a database
    // and redirect to the tournament view page
    console.log('Tournament created:', {
      name: tournamentName,
      buyIn,
      startingChips,
      blindLevels,
      breakInterval,
      breakDuration,
      payoutStructure: selectedPayoutStructure,
      lateRegistration
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
            Create New Tournament
          </h1>
          <Link href="/" className="text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Tournament Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-1">Tournament Name</label>
                  <input 
                    type="text"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="e.g. $500 No-Limit Hold'em"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Buy-in Amount ($)</label>
                    <input 
                      type="number"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                      value={buyIn}
                      onChange={(e) => setBuyIn(Number(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Starting Chips</label>
                    <input 
                      type="number"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                      value={startingChips}
                      onChange={(e) => setStartingChips(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Level Duration (minutes)</label>
                    <input 
                      type="number"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                      value={levelDuration}
                      onChange={(e) => setLevelDuration(Number(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Late Registration (levels)</label>
                    <input 
                      type="number"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                      value={lateRegistration}
                      onChange={(e) => setLateRegistration(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Break Interval (levels)</label>
                    <input 
                      type="number"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                      value={breakInterval}
                      onChange={(e) => setBreakInterval(Number(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Break Duration (minutes)</label>
                    <input 
                      type="number"
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                      value={breakDuration}
                      onChange={(e) => setBreakDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">Payout Structure</label>
                  <select 
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                    value={selectedPayoutStructure}
                    onChange={(e) => setSelectedPayoutStructure(e.target.value)}
                  >
                    <option value="standard">Standard (15% of field)</option>
                    <option value="flat">Flat (20% of field)</option>
                    <option value="steep">Steep (10% of field)</option>
                    <option value="final-table">Final Table Only</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Blind Structure */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Blind Structure</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={removeBlindLevel}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Remove Level
                  </button>
                  <button 
                    onClick={addBlindLevel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Add Level
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2">Level</th>
                      <th className="text-left p-2">Small Blind</th>
                      <th className="text-left p-2">Big Blind</th>
                      <th className="text-left p-2">Ante</th>
                      <th className="text-left p-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blindLevels.map((level, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <input 
                            type="number"
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded p-1"
                            value={level.small}
                            onChange={(e) => updateBlindLevel(index, 'small', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded p-1"
                            value={level.big}
                            onChange={(e) => updateBlindLevel(index, 'big', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded p-1"
                            value={level.ante || 0}
                            onChange={(e) => updateBlindLevel(index, 'ante', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded p-1"
                            value={level.duration}
                            onChange={(e) => updateBlindLevel(index, 'duration', Number(e.target.value))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                Tip: You can customize each level individually or use the "Add Level" button to automatically calculate the next level.
              </div>
            </div>
          </div>
          
          {/* Preview & Actions */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Tournament Summary</h2>
              
              <div className="space-y-3">
                <div>
                  <div className="text-gray-400 text-sm">Tournament Name</div>
                  <div className="font-medium">{tournamentName || 'Unnamed Tournament'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-400 text-sm">Buy-in</div>
                    <div className="font-medium">${buyIn}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm">Starting Chips</div>
                    <div className="font-medium">{startingChips.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-400 text-sm">Level Duration</div>
                    <div className="font-medium">{levelDuration} minutes</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm">Number of Levels</div>
                    <div className="font-medium">{blindLevels.length}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-400 text-sm">Break Interval</div>
                    <div className="font-medium">Every {breakInterval} levels</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm">Break Duration</div>
                    <div className="font-medium">{breakDuration} minutes</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-400 text-sm">Estimated Duration</div>
                  <div className="font-medium">
                    {Math.floor((blindLevels.reduce((sum, level) => sum + level.duration, 0) + 
                      Math.floor(blindLevels.length / breakInterval) * breakDuration) / 60)} hours{' '}
                    {(blindLevels.reduce((sum, level) => sum + level.duration, 0) + 
                      Math.floor(blindLevels.length / breakInterval) * breakDuration) % 60} minutes
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Blind Structure Preview</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="font-medium">Level 1</div>
                  <div className="text-gray-300">{blindLevels[0]?.small}/{blindLevels[0]?.big}</div>
                </div>
                
                {blindLevels.length > 5 && (
                  <div className="flex justify-between">
                    <div className="font-medium">Level 5</div>
                    <div className="text-gray-300">{blindLevels[4]?.small}/{blindLevels[4]?.big}</div>
                  </div>
                )}
                
                {blindLevels.length > 10 && (
                  <div className="flex justify-between">
                    <div className="font-medium">Level 10</div>
                    <div className="text-gray-300">{blindLevels[9]?.small}/{blindLevels[9]?.big}</div>
                  </div>
                )}
                
                {blindLevels.length > 15 && (
                  <div className="flex justify-between">
                    <div className="font-medium">Level 15</div>
                    <div className="text-gray-300">{blindLevels[14]?.small}/{blindLevels[14]?.big}</div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <div className="font-medium">Final Level</div>
                  <div className="text-gray-300">
                    {blindLevels[blindLevels.length - 1]?.small}/{blindLevels[blindLevels.length - 1]?.big}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCreateTournament}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition duration-200"
              >
                Create Tournament
              </button>
              
              <Link 
                href="/tournament/templates"
                className="bg-transparent border border-gray-600 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition duration-200 text-center"
              >
                Use Template
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTournament; 