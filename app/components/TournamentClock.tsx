'use client';

import { useState, useEffect } from 'react';

interface TournamentClockProps {
  currentLevel: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  timeRemaining: number; // in seconds
  isBreak: boolean;
  isPaused: boolean;
  prizePool?: number; // Optional prize pool amount
  payouts?: { position: number; amount: number }[]; // Optional array of payouts
  eliminatedPlayers?: number[]; // Array of positions that have already been eliminated
  onTimerEnd: () => void;
  onPauseToggle: () => void;
  onNextLevel: () => void;
  onPrevLevel: () => void;
}

const TournamentClock: React.FC<TournamentClockProps> = ({
  currentLevel,
  smallBlind,
  bigBlind,
  ante,
  timeRemaining,
  isBreak,
  isPaused,
  prizePool = 0, // Default to 0 if not provided
  payouts = [], // Default to empty array if not provided
  eliminatedPlayers = [], // Default to empty array if not provided
  onTimerEnd,
  onPauseToggle,
  onNextLevel,
  onPrevLevel,
}) => {
  const [remainingTime, setRemainingTime] = useState(timeRemaining);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Format time as HH:MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return amount >= 1000 
      ? `$${(amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}K`
      : `$${amount.toLocaleString()}`;
  };

  // Timer logic
  useEffect(() => {
    setRemainingTime(timeRemaining);
  }, [timeRemaining]);

  // Update timer every second
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimerEnd();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPaused, onTimerEnd]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Exit fullscreen if Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      
      // Spacebar to toggle pause
      if (e.key === ' ' || e.key === 'Spacebar') {
        onPauseToggle();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onPauseToggle]);
  
  // Get top 3 payouts + the next to cash
  const getDisplayPayouts = () => {
    // Sort payouts by position
    const sortedPayouts = [...payouts].sort((a, b) => a.position - b.position);
    
    // Get the top 3 payouts
    const top3 = sortedPayouts.filter(p => p.position <= 3);
    
    // Find the next payout position that hasn't been eliminated
    let nextToCash = null;
    
    if (eliminatedPlayers.length > 0) {
      // Sort eliminated players in descending order (most recent eliminations first)
      const sortedEliminated = [...eliminatedPlayers].sort((a, b) => b - a);
      
      // Get the most recent elimination
      const lastEliminatedPosition = sortedEliminated[0];
      
      // Find the next payout position after the last eliminated player
      nextToCash = sortedPayouts.find(p => p.position > lastEliminatedPosition);
    }
    
    // If no next to cash found but there are payouts, take the first one
    // (this happens when no players have been eliminated yet)
    if (!nextToCash && sortedPayouts.length > 0 && sortedPayouts[0].position > 3) {
      nextToCash = sortedPayouts[0];
    }
    
    // Combine top 3 and next to cash
    const displayPayouts = [...top3];
    
    // Add next to cash if it's not already in top3
    if (nextToCash && !displayPayouts.some(p => p.position === nextToCash?.position)) {
      displayPayouts.push(nextToCash);
    }
    
    return displayPayouts;
  };
  
  if (isFullscreen) {
    // Get payouts to display (top 3 + next to cash)
    const displayPayouts = getDisplayPayouts();
    
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col justify-center items-center z-50">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button 
            className="bg-gray-800 hover:bg-gray-700 rounded-full p-2 text-gray-300"
            onClick={toggleFullscreen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="w-full max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
            {/* Left side - Clock and level */}
            <div className="flex-1">
              {/* Very large clock display */}
              <div className="text-center md:text-left mb-6">
                <div className="text-gray-400 text-xl mb-2">
                  {isBreak ? 'BREAK ENDS IN' : 'TIME REMAINING'}
                </div>
                <div className="text-6xl md:text-9xl font-bold font-mono tracking-wider text-white">
                  {formatTime(remainingTime)}
                </div>
              </div>
              
              <div className="text-center md:text-left">
                <div className="text-gray-400 text-xl mb-2">
                  {isBreak ? 'BREAK' : 'LEVEL'}
                </div>
                <div className="text-4xl md:text-7xl font-bold tracking-wider text-white mb-6">
                  {isBreak ? 'BREAK' : currentLevel}
                </div>
              </div>
            </div>
            
            {/* Right side - Prize pool and payouts */}
            <div className="w-full md:w-1/3 flex flex-col">
              {/* Prize Pool */}
              <div className="bg-gray-800/40 rounded-2xl p-6 backdrop-blur-sm backdrop-filter mb-4">
                <div className="text-gray-400 text-lg mb-2">PRIZE POOL</div>
                <div className="text-3xl md:text-5xl font-bold tracking-wider text-white">
                  ${prizePool.toLocaleString()}
                </div>
              </div>
              
              {/* Top Payouts */}
              <div className="bg-gray-800/40 rounded-2xl p-6 backdrop-blur-sm backdrop-filter">
                <div className="text-gray-400 text-lg mb-4">TOP PAYOUTS</div>
                
                {displayPayouts.length > 0 ? (
                  <div className="space-y-4">
                    {displayPayouts.map(payout => (
                      <div key={payout.position} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                            ${payout.position === 1 ? 'bg-amber-500/80' : 
                              payout.position === 2 ? 'bg-gray-300/80' : 
                                payout.position === 3 ? 'bg-amber-700/80' : 'bg-blue-600/80'}`}>
                            {payout.position}
                          </div>
                          <div className="text-lg text-white">
                            {payout.position === 1 ? '1st Place' : 
                             payout.position === 2 ? '2nd Place' : 
                             payout.position === 3 ? '3rd Place' : 
                             `Next to Cash (${getOrdinalSuffix(payout.position)})`}
                          </div>
                        </div>
                        <div className="text-xl font-bold text-white">
                          ${payout.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-center">
                    No payout structure set
                  </div>
                )}
              </div>
            </div>
          </div>
        
          <div className="grid grid-cols-3 gap-4 text-center mt-4">
            <div className="bg-gray-800/40 p-4 rounded-xl backdrop-blur-sm backdrop-filter">
              <div className="text-gray-400 text-lg">Small Blind</div>
              <div className="text-3xl font-bold text-white">{smallBlind}</div>
            </div>
            <div className="bg-gray-800/40 p-4 rounded-xl backdrop-blur-sm backdrop-filter">
              <div className="text-gray-400 text-lg">Big Blind</div>
              <div className="text-3xl font-bold text-white">{bigBlind}</div>
            </div>
            <div className="bg-gray-800/40 p-4 rounded-xl backdrop-blur-sm backdrop-filter">
              <div className="text-gray-400 text-lg">Ante</div>
              <div className="text-3xl font-bold text-white">{ante || '-'}</div>
            </div>
          </div>
          
          {/* Large pause button */}
          <div className="mt-12 flex justify-center">
            <button
              className={`flex items-center justify-center text-2xl font-bold py-6 px-10 rounded-full shadow-lg transition-all ${
                isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              onClick={onPauseToggle}
            >
              {isPaused ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pause
                </>
              )}
            </button>
          </div>
          
          <div className="text-gray-500 mt-8 text-center">
            Press Space to {isPaused ? 'Resume' : 'Pause'} • Press Esc to Exit Fullscreen
          </div>
        </div>
      </div>
    );
  }
  
  // Add a helper function for ordinal suffixes
  const getOrdinalSuffix = (n: number): string => {
    if (n % 100 >= 11 && n % 100 <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  // For the non-fullscreen view, also update the payouts display
  // Get payouts to display (top 3 + next to cash)
  const displayPayouts = getDisplayPayouts();

  return (
    <div className="w-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
      {/* Main Display */}
      <div className="p-4 md:p-6">
        {/* Level and Timer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/60 p-4 rounded-xl text-center flex flex-col justify-center">
            <div className="text-gray-400 text-sm mb-1">Level</div>
            <div className="text-2xl md:text-3xl font-bold text-white">
              {isBreak ? 'BREAK' : currentLevel}
            </div>
          </div>
          
          <div className="col-span-2 bg-gray-800/60 p-4 rounded-xl text-center relative group">
            <div className="text-gray-400 text-sm mb-1">{isBreak ? 'Break Ends In' : 'Time Remaining'}</div>
            <div className="text-3xl md:text-5xl font-bold text-white font-mono">
              {formatTime(remainingTime)}
            </div>
            
            {/* Pause overlay */}
            <button 
              onClick={onPauseToggle}
              className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <span className={`flex items-center justify-center text-lg font-bold py-2 px-6 rounded-full transition ${
                isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}>
                {isPaused ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    Resume
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pause
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
        
        {/* Blinds and Ante Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/60 p-3 rounded-xl">
                <div className="text-gray-400 text-sm">Small Blind</div>
                <div className="text-xl font-bold text-white">{smallBlind}</div>
              </div>
              
              <div className="bg-gray-800/60 p-3 rounded-xl">
                <div className="text-gray-400 text-sm">Big Blind</div>
                <div className="text-xl font-bold text-white">{bigBlind}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-gray-800/60 p-3 rounded-xl">
                <div className="text-gray-400 text-sm">Ante</div>
                <div className="text-xl font-bold text-white">{ante || '-'}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="bg-gray-800/60 p-3 rounded-xl">
              <div className="text-gray-400 text-sm">Current Ratio</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-500">SB/BB Ratio</div>
                  <div className="text-white font-bold">
                    1:{bigBlind/smallBlind}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Blinds With Ante</div>
                  <div className="text-white font-bold">
                    {ante > 0 ? `${ante} per player` : 'No ante'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/60 p-3 rounded-xl">
              <div className="text-sm text-gray-400">Status</div>
              <div className="flex items-center mt-1">
                <div className={`w-3 h-3 rounded-full mr-2 ${isPaused ? 'bg-red-500 pulse-animation' : 'bg-green-500'}`}></div>
                <div className="text-white font-bold">
                  {isPaused ? 'Paused' : isBreak ? 'On Break' : 'Running'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-span-2 md:col-span-1 bg-gray-800/60 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Payouts</div>
          
          {displayPayouts.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {displayPayouts.map(payout => (
                <div key={payout.position} className="flex justify-between items-center">
                  <span className="text-sm">
                    {payout.position === 1 ? '1st' : 
                     payout.position === 2 ? '2nd' : 
                     payout.position === 3 ? '3rd' : 
                     `Next (${payout.position}${getOrdinalSuffix(payout.position)})`}:
                  </span>
                  <span className="font-medium">{formatCurrency(payout.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">
              No payout structure set
            </div>
          )}
        </div>
      </div>
      
      {/* Control Bar */}
      <div className="bg-gray-950 p-3 flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium"
            onClick={onPrevLevel}
          >
            <span className="hidden md:inline">Previous Level</span>
            <span className="md:hidden">Prev</span>
          </button>
          
          <button 
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium"
            onClick={onNextLevel}
          >
            <span className="hidden md:inline">Next Level</span>
            <span className="md:hidden">Next</span>
          </button>
        </div>
        
        <div className="flex gap-2">
          <button 
            className={`flex items-center justify-center py-2 px-4 rounded-lg font-medium transition ${
              isPaused 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            onClick={onPauseToggle}
          >
            {isPaused ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                <span className="hidden md:inline">Resume</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden md:inline">Pause</span>
              </>
            )}
          </button>
          
          <button 
            className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium flex items-center"
            onClick={toggleFullscreen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            <span className="hidden md:inline">Fullscreen</span>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default TournamentClock; 