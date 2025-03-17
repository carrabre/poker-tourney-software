'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, ReadonlyURLSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { saveTournament, saveBlindStructure } from '@/app/utils/localStorage';
import Footer from '@/app/components/Footer';

// Define interfaces locally
interface BlindLevel {
  small: number;
  big: number;
  ante?: number;
  bringIn?: number;
  duration: number; // in minutes
}

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

// Function to generate a random tournament ID
const generateTournamentId = () => {
  return Math.random().toString(36).substring(2, 10);
};

// For the useSearchParams hook, we need to create a dedicated client component
// that is wrapped in Suspense
function TournamentParams({ 
  children 
}: { 
  children: (params: ReadonlyURLSearchParams | null) => React.ReactNode 
}) {
  // This is fine to use here since this component will be wrapped in Suspense
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}

// Main component that uses params passed down
function NewTournamentContent({ searchParams }: { searchParams: ReadonlyURLSearchParams | null }) {
  const router = useRouter();
  
  const [tournamentName, setTournamentName] = useState('');
  const [buyIn, setBuyIn] = useState(100);
  const [entryFee, setEntryFee] = useState(20);
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
  const [enableBreaks, setEnableBreaks] = useState(true);

  // Check for template parameters on component mount
  useEffect(() => {
    if (searchParams) {
      const template = searchParams.get('template');
      if (template) {
        // Set values from template parameters
        setTournamentName(searchParams.get('name') || '');
        setBuyIn(Number(searchParams.get('buyIn')) || 100);
        setEntryFee(Number(searchParams.get('entryFee')) || 20);
        setStartingChips(Number(searchParams.get('startingChips')) || 10000);
        setLevelDuration(Number(searchParams.get('levelDuration')) || 20);
        setBreakInterval(Number(searchParams.get('breakInterval')) || 4);
        setBreakDuration(Number(searchParams.get('breakDuration')) || 15);
        
        // Update blind levels with the new duration
        const newDuration = Number(searchParams.get('levelDuration')) || 20;
        setBlindLevels(prevLevels => 
          prevLevels.map(level => ({
            ...level,
            duration: newDuration
          }))
        );
      }
    }
  }, [searchParams]);

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

  // Create the tournament
  const handleCreateTournament = async () => {
    if (!tournamentName.trim()) {
      alert('Please enter a tournament name');
      return;
    }
    
    try {
      // Generate a unique tournament ID
      const tournamentId = generateTournamentId();
      
      // Create tournament object
      const tournament: Tournament = {
        id: tournamentId,
        name: tournamentName.trim(),
        startingChips,
        buyIn,
        entryFee,
        maxRebuys: 0, // Default value, will be editable in the tournament view
        rebuyAmount: 0, // Default value
        rebuyChips: 0, // Default value
        allowAddOns: false, // Default value
        addOnAmount: 0, // Default value
        addOnChips: 0, // Default value
        nextBreak: breakInterval,
        breakLength: breakDuration,
        created_at: new Date().toISOString(),
      };
      
      // Save tournament to localStorage
      saveTournament(tournament);
      
      // Save blind structure
      saveBlindStructure(tournamentId, blindLevels);
      
      // Redirect to the view page with the tournament ID as a query parameter
      router.push(`/tournament/view?id=${tournamentId}`);
    } catch (err) {
      console.error('Error creating tournament:', err);
      alert(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Update all level durations when the global duration changes
  const handleLevelDurationChange = (newDuration: number) => {
    setLevelDuration(newDuration);
    setBlindLevels(prevLevels => 
      prevLevels.map(level => ({
        ...level,
        duration: newDuration
      }))
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#f5f5f7] to-[#f0f0f5] dark:from-[#111111] dark:to-[#000000] text-gray-900 dark:text-white transition-colors duration-500">
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
                  Create New Tournament
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Configure your tournament settings
                </motion.p>
              </div>
              
              <div className="flex gap-2">
                <Link href="/" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                  Home
                </Link>
                <Link href="/tournament/templates" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                  Templates
                </Link>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-screen-xl mx-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <h2 className="text-xl font-bold mb-4">Tournament Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1">Tournament Name</label>
                    <input 
                      type="text"
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                      placeholder="e.g. $500 No-Limit Hold'em"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1">Buy-in Amount ($)</label>
                      <input 
                        type="number"
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                        value={buyIn}
                        onChange={(e) => setBuyIn(Number(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1">Entry Fee ($)</label>
                      <input 
                        type="number"
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                        value={entryFee}
                        onChange={(e) => setEntryFee(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1">Starting Chips</label>
                      <input 
                        type="number"
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                        value={startingChips}
                        onChange={(e) => setStartingChips(Number(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1">Level Duration (minutes)</label>
                      <input 
                        type="number"
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                        value={levelDuration}
                        onChange={(e) => handleLevelDurationChange(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1">Late Registration (levels)</label>
                      <input 
                        type="number"
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                        value={lateRegistration}
                        onChange={(e) => setLateRegistration(Number(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 mb-1">Payout Structure</label>
                      <select 
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        id="enableBreaks"
                        className="w-4 h-4 mr-2 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={enableBreaks}
                        onChange={(e) => setEnableBreaks(e.target.checked)}
                      />
                      <label htmlFor="enableBreaks" className="text-gray-600 dark:text-gray-400">
                        Enable Breaks
                      </label>
                    </div>
                  </div>
                  
                  {enableBreaks && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-600 dark:text-gray-400 mb-1">Break Interval (levels)</label>
                        <input 
                          type="number"
                          className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                          value={breakInterval}
                          onChange={(e) => setBreakInterval(Number(e.target.value))}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-600 dark:text-gray-400 mb-1">Break Duration (minutes)</label>
                        <input 
                          type="number"
                          className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-2"
                          value={breakDuration}
                          onChange={(e) => setBreakDuration(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Blind Structure */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
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
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Add Level
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-2">Level</th>
                        <th className="text-left p-2">Small Blind</th>
                        <th className="text-left p-2">Big Blind</th>
                        <th className="text-left p-2">Ante</th>
                        <th className="text-left p-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blindLevels.map((level, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">
                            <input 
                              type="number"
                              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded p-1"
                              value={level.small}
                              onChange={(e) => updateBlindLevel(index, 'small', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number"
                              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded p-1"
                              value={level.big}
                              onChange={(e) => updateBlindLevel(index, 'big', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number"
                              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded p-1"
                              value={level.ante || 0}
                              onChange={(e) => updateBlindLevel(index, 'ante', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number"
                              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded p-1"
                              value={level.duration}
                              onChange={(e) => updateBlindLevel(index, 'duration', Number(e.target.value))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Tip: You can customize each level individually or use the "Add Level" button to automatically calculate the next level.
                </div>
              </motion.div>
            </div>
            
            {/* Preview & Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Tournament Summary</h2>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Tournament Name</div>
                    <div className="font-medium">{tournamentName || 'Unnamed Tournament'}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">Buy-in</div>
                      <div className="font-medium">${buyIn}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">Entry Fee</div>
                      <div className="font-medium">${entryFee}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">Starting Chips</div>
                      <div className="font-medium">{startingChips.toLocaleString()}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">Level Duration</div>
                      <div className="font-medium">{levelDuration} minutes</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">Number of Levels</div>
                      <div className="font-medium">{blindLevels.length}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">Breaks</div>
                      <div className="font-medium">
                        {enableBreaks 
                          ? `Every ${breakInterval} levels (${breakDuration} min)` 
                          : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Estimated Duration</div>
                    <div className="font-medium">
                      {Math.floor((blindLevels.reduce((sum, level) => sum + level.duration, 0) + 
                        (enableBreaks ? Math.floor(blindLevels.length / breakInterval) * breakDuration : 0)) / 60)} hours{' '}
                      {(blindLevels.reduce((sum, level) => sum + level.duration, 0) + 
                        (enableBreaks ? Math.floor(blindLevels.length / breakInterval) * breakDuration : 0)) % 60} minutes
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Blind Structure Preview</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="font-medium">Level 1</div>
                    <div className="text-gray-600 dark:text-gray-300">{blindLevels[0]?.small}/{blindLevels[0]?.big}</div>
                  </div>
                  
                  {blindLevels.length > 5 && (
                    <div className="flex justify-between">
                      <div className="font-medium">Level 5</div>
                      <div className="text-gray-600 dark:text-gray-300">{blindLevels[4]?.small}/{blindLevels[4]?.big}</div>
                    </div>
                  )}
                  
                  {blindLevels.length > 10 && (
                    <div className="flex justify-between">
                      <div className="font-medium">Level 10</div>
                      <div className="text-gray-600 dark:text-gray-300">{blindLevels[9]?.small}/{blindLevels[9]?.big}</div>
                    </div>
                  )}
                  
                  {blindLevels.length > 15 && (
                    <div className="flex justify-between">
                      <div className="font-medium">Level 15</div>
                      <div className="text-gray-600 dark:text-gray-300">{blindLevels[14]?.small}/{blindLevels[14]?.big}</div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <div className="font-medium">Final Level</div>
                    <div className="text-gray-600 dark:text-gray-300">
                      {blindLevels[blindLevels.length - 1]?.small}/{blindLevels[blindLevels.length - 1]?.big}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleCreateTournament}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition duration-200"
                >
                  Create Tournament
                </button>
                
                <Link 
                  href="/tournament/templates"
                  className="bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-medium transition duration-200 text-center"
                >
                  Browse Templates
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
        
        {/* Use the Footer component */}
        <Footer />
      </div>
    </>
  );
}

// Wrap with Suspense to fix the Vercel build error
export default function NewTournament() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p>Loading tournament creator...</p>
        </div>
      </div>
    }>
      <TournamentParams>
        {(searchParams) => <NewTournamentContent searchParams={searchParams} />}
      </TournamentParams>
    </Suspense>
  );
} 