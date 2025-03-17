'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';

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
  onTimeUpdate?: (newTime: number) => void; // Optional callback to update parent's time
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
  onTimeUpdate
}) => {
  // Maintain local state for remaining time
  const [remainingTime, setRemainingTime] = useState(timeRemaining);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPauseAnimating, setIsPauseAnimating] = useState(false);
  
  // Use refs to keep track of timer state across renders
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(timeRemaining);
  // Add a new ref to track accumulated elapsed time across pause/unpause cycles
  const cumulativeElapsedRef = useRef<number>(0);
  
  // Always keep remainingTimeRef updated with the latest value
  remainingTimeRef.current = remainingTime;
  
  // Update local state when timeRemaining prop changes significantly
  useEffect(() => {
    console.log('[CLOCK] timeRemaining prop changed to:', timeRemaining);
    
    // Check for a large change in time which indicates a level change rather than a small update
    const isSignificantChange = Math.abs(timeRemaining - remainingTime) > 5;
    
    // Only update if:
    // 1. We're paused (safe to update directly) OR
    // 2. There's a significant difference (likely a level change)
    if (isPaused || isSignificantChange) {
      console.log('[CLOCK] Updating local state to match prop:', timeRemaining);
      setRemainingTime(timeRemaining);
      
      // If this is a significant change, also reset our elapsed time tracking
      if (isSignificantChange) {
        console.log('[CLOCK] Significant time change detected, resetting cumulative elapsed time');
        cumulativeElapsedRef.current = 0;
      }
    } else {
      console.log('[CLOCK] Minor prop change while running - ignoring to prevent reset');
    }
  }, [timeRemaining, isPaused, remainingTime]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
  
  // Start timer function
  const startTimer = useCallback(() => {
    // Clear any existing timers first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('[CLOCK] 🧹 Cleared existing timer');
    }
    
    // Don't start if no time left
    if (remainingTimeRef.current <= 0) {
      console.log('[CLOCK] ⚠️ Not starting timer - no time remaining');
      return;
    }
    
    console.log('[CLOCK] ▶️ STARTING TIMER with remaining time:', remainingTimeRef.current);
    console.log('[CLOCK] 📊 Cumulative elapsed time so far:', cumulativeElapsedRef.current);
    
    // Record the start time for this timer session
    const startTime = Date.now();
    startTimeRef.current = startTime;
    
    // Store the current remaining time when starting - CRITICAL for continuity
    const initialRemainingTime = remainingTimeRef.current;
    console.log('[CLOCK] 📊 Initial time remaining:', initialRemainingTime);
    
    // Create a new interval
    timerRef.current = setInterval(() => {
      try {
        // Calculate elapsed time since THIS timer session started
        const sessionElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const totalElapsedSeconds = sessionElapsedSeconds + cumulativeElapsedRef.current;
        
        // Calculate new remaining time based on initial time minus session elapsed
        // This is the key fix - we use initialRemainingTime as our base instead of timeRemaining
        const newRemainingTime = Math.max(0, initialRemainingTime - sessionElapsedSeconds);
        
        // Only update state if the time has actually changed and we haven't been paused
        if (newRemainingTime !== remainingTimeRef.current && !isPaused) {
          setRemainingTime(newRemainingTime);
          
          // Update parent component every 5 seconds to keep it in sync
          if (onTimeUpdate && (newRemainingTime % 5 === 0 || newRemainingTime <= 10)) {
            console.log(`[CLOCK] 📤 Updating parent with current time: ${newRemainingTime}s`);
            onTimeUpdate(newRemainingTime);
          }
          
          // Log every 5 seconds or in the final countdown
          if (newRemainingTime % 5 === 0 || newRemainingTime <= 10) {
            console.log(`[CLOCK] ⏱️ Timer: ${newRemainingTime}s remaining (session elapsed: ${sessionElapsedSeconds}s, total elapsed: ${totalElapsedSeconds}s)`);
          }
          
          // Check for timer end
          if (newRemainingTime === 0) {
            console.log('[CLOCK] ⏰ Timer finished, calling onTimerEnd()');
            clearInterval(timerRef.current!);
            timerRef.current = null;
            
            // Reset cumulative elapsed time since we're starting a new level
            cumulativeElapsedRef.current = 0;
            
            onTimerEnd();
          }
        }
      } catch (error) {
        console.error('[CLOCK] Error in timer interval:', error);
      }
    }, 100); // Update frequently for smooth display
    
    console.log('[CLOCK] ✅ Timer interval set with 100ms updates');
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        console.log('[CLOCK] 🧹 Cleanup: Timer cleared');
      }
    };
  }, [onTimerEnd, isPaused, onTimeUpdate]); // Add onTimeUpdate to dependencies
  
  // Stop timer function
  const stopTimer = useCallback(() => {
    // Only stop if a timer is running
    if (timerRef.current) {
      console.log('[CLOCK] ⏸️ STOPPING TIMER');
      
      // Calculate how much time has elapsed in this session before stopping
      const sessionElapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Add the session elapsed time to our cumulative elapsed time
      cumulativeElapsedRef.current += sessionElapsedSeconds;
      
      // Calculate the current time remaining
      const currentTimeRemaining = remainingTimeRef.current;
      
      console.log('[CLOCK] 📊 Adding session elapsed time:', sessionElapsedSeconds, 
                  'to cumulative:', cumulativeElapsedRef.current);
      console.log('[CLOCK] 📊 Current time remaining on pause:', currentTimeRemaining);
      
      // Update parent with the exact time when pausing
      if (onTimeUpdate) {
        console.log(`[CLOCK] 📤 Updating parent on pause with exact time: ${currentTimeRemaining}s`);
        onTimeUpdate(currentTimeRemaining);
      }
      
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [onTimeUpdate]);
  
  // Effect to handle isPaused changes
  useEffect(() => {
    console.log('[CLOCK] ⚠️ isPaused changed to:', isPaused, 'with remainingTime:', remainingTime);
    
    if (isPaused) {
      // When pausing, stop the timer and accumulate elapsed time
      stopTimer();
      console.log('[CLOCK] ⏹️ Timer STOPPED at', remainingTime, 'seconds');
    } else {
      // When unpausing, start the timer without changing the remaining time
      console.log('[CLOCK] ▶️ STARTING timer with', remainingTime, 'seconds');
      console.log('[CLOCK] 📊 Total elapsed so far:', cumulativeElapsedRef.current);
      
      // Start the timer without modifying the remaining time
      startTimer();
      
      console.log('[CLOCK] ✅ Timer is now RUNNING');
    }
  }, [isPaused, remainingTime, stopTimer, startTimer]);

  // Reset cumulative elapsed time when level changes (e.g., when timeRemaining prop changes significantly)
  useEffect(() => {
    // If timeRemaining changed by more than 5 seconds, we likely switched levels
    if (Math.abs(timeRemaining - remainingTime) > 5) {
      console.log('[CLOCK] 🔄 Level or time changed significantly, resetting cumulative elapsed time');
      cumulativeElapsedRef.current = 0;
    }
  }, [timeRemaining, remainingTime]);
  
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
  
  // Toggle pause handler with visual feedback
  const handlePauseToggle = useCallback(() => {
    console.log('[CLOCK] 🔄 Pause button clicked, current isPaused:', isPaused);
    
    // Visual feedback animation
    setIsPauseAnimating(true);
    setTimeout(() => setIsPauseAnimating(false), 300);
    
    // IMPORTANT: Save the current time value before calling parent handler
    // This preserves our time in case the parent component causes re-renders
    const timeValueBeforeToggle = remainingTime;
    console.log('[CLOCK] 📊 Saving time before toggle:', timeValueBeforeToggle);
    
    // Call the parent component's handler
    console.log('[CLOCK] 📣 Calling parent onPauseToggle function');
    onPauseToggle();
    
    // We no longer need to flush updates - this was causing problems
    // by causing the timer to reset during the toggle
    
    // Log what we expect to happen
    console.log(`[CLOCK] 🔄 Expect isPaused to change from ${isPaused} to ${!isPaused}`);
    console.log(`[CLOCK] 🔄 Time should remain at ${timeValueBeforeToggle} seconds`);
    
    // Add logging to verify the change was processed
    setTimeout(() => {
      console.log('[CLOCK] 🔍 After toggle, isPaused prop is now:', isPaused);
      console.log('[CLOCK] 🔍 After toggle, remainingTime is:', remainingTime);
      
      // If the time value changed unexpectedly, log a warning
      if (Math.abs(remainingTime - timeValueBeforeToggle) > 2 && !isPaused) {
        console.warn('[CLOCK] ⚠️ Time value changed unexpectedly during toggle!', 
                     'Before:', timeValueBeforeToggle, 'After:', remainingTime);
      }
    }, 50);
  }, [isPaused, onPauseToggle, remainingTime]);
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    console.log('[CLOCK] Toggling fullscreen mode', !isFullscreen);
    setIsFullscreen(prev => !prev);
  }, [isFullscreen]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent actions if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      try {
        console.log(`[CLOCK] Key pressed: ${e.key} (fullscreen: ${isFullscreen})`);
        
        if (e.key === 'Escape' && isFullscreen) {
          console.log('[CLOCK] ESC pressed in fullscreen - exiting fullscreen');
          setIsFullscreen(false);
          e.preventDefault();
        }
        
        // Spacebar to toggle pause
        if (e.key === ' ' || e.key === 'Spacebar') {
          console.log('[CLOCK] SPACE pressed - toggling pause');
          e.preventDefault(); // Prevent scrolling
          handlePauseToggle();
        }
        
        // Left/right arrows for previous/next level
        if (e.key === 'ArrowRight') {
          console.log('[CLOCK] RIGHT ARROW pressed - next level');
          e.preventDefault();
          onNextLevel();
        }
        
        if (e.key === 'ArrowLeft') {
          console.log('[CLOCK] LEFT ARROW pressed - previous level');
          e.preventDefault();
          onPrevLevel();
        }
        
        // F key for fullscreen
        if (e.key === 'f' || e.key === 'F') {
          console.log('[CLOCK] F pressed - toggling fullscreen');
          e.preventDefault();
          toggleFullscreen();
        }
      } catch (error) {
        console.error('Error handling keyboard shortcut:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, handlePauseToggle, onNextLevel, onPrevLevel, toggleFullscreen]);
  
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
  
  // Helper function for ordinal suffixes
  const getOrdinalSuffix = (n: number): string => {
    if (n % 100 >= 11 && n % 100 <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // For the non-fullscreen view, get payouts
  const displayPayouts = getDisplayPayouts();
  
  if (isFullscreen) {
    // Get payouts to display (top 3 + next to cash)
    const displayPayouts = getDisplayPayouts();
    
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col justify-center items-center z-40 tournament-clock">
        <div className="absolute top-6 right-6 flex space-x-3">
          <button 
            className="bg-gray-800 hover:bg-gray-700 rounded-full p-3 text-gray-300 transition-all duration-300 transform hover:scale-110 shadow-lg"
            onClick={toggleFullscreen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="w-full max-w-6xl px-8">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-14">
            {/* Left side - Clock and level */}
            <div className="flex-1 animation: fadeIn 0.5s ease-out">
              {/* Very large clock display */}
              <div className="text-center md:text-left mb-8">
                <div className="text-gray-400 text-xl mb-3">
                  {isBreak ? 'BREAK ENDS IN' : 'TIME REMAINING'}
                </div>
                <div className="text-6xl md:text-9xl font-bold font-mono tracking-wider text-white time-display">
                  <span className={!isPaused ? "running-timer" : ""}>{formatTime(remainingTime)}</span>
                </div>
              </div>
              
              <div className="text-center md:text-left">
                <div className="text-gray-400 text-xl mb-3">
                  {isBreak ? 'BREAK' : 'LEVEL'}
                </div>
                <div className="text-4xl md:text-7xl font-bold tracking-wider text-white mb-8">
                  {isBreak ? 'BREAK' : currentLevel}
                </div>
              </div>
            </div>
            
            {/* Right side - Prize pool and payouts */}
            <div className="w-full md:w-1/3 flex flex-col space-y-5 animation: slideInFromRight 0.5s ease-out">
              {/* Prize Pool */}
              <div className="bg-gray-800/40 rounded-2xl p-6 backdrop-blur-sm backdrop-filter transition-all hover:bg-gray-800/60">
                <div className="text-gray-400 text-lg mb-2">PRIZE POOL</div>
                <div className="text-3xl md:text-5xl font-bold tracking-wider text-white">
                  ${prizePool.toLocaleString()}
                </div>
              </div>
              
              {/* Top Payouts */}
              <div className="bg-gray-800/40 rounded-2xl p-6 backdrop-blur-sm backdrop-filter transition-all hover:bg-gray-800/60">
                <div className="text-gray-400 text-lg mb-5">TOP PAYOUTS</div>
                
                {displayPayouts.length > 0 ? (
                  <div className="space-y-5">
                    {displayPayouts.map(payout => (
                      <div key={payout.position} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center mr-3 shadow-md
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
        
          <div className="grid grid-cols-3 gap-5 text-center mt-6">
            <div className="bg-gray-800/40 p-5 rounded-xl backdrop-blur-sm backdrop-filter transition-all hover:bg-gray-800/60">
              <div className="text-gray-400 text-lg mb-1">Small Blind</div>
              <div className="text-3xl font-bold text-white">{smallBlind}</div>
            </div>
            <div className="bg-gray-800/40 p-5 rounded-xl backdrop-blur-sm backdrop-filter transition-all hover:bg-gray-800/60">
              <div className="text-gray-400 text-lg mb-1">Big Blind</div>
              <div className="text-3xl font-bold text-white">{bigBlind}</div>
            </div>
            <div className="bg-gray-800/40 p-5 rounded-xl backdrop-blur-sm backdrop-filter transition-all hover:bg-gray-800/60">
              <div className="text-gray-400 text-lg mb-1">Ante</div>
              <div className="text-3xl font-bold text-white">{ante || '-'}</div>
            </div>
          </div>
          
          {/* Large pause button with enhanced animation */}
          <div className="mt-14 flex justify-center">
            <button
              className={`flex items-center justify-center text-2xl font-bold py-7 px-12 rounded-full shadow-xl transition-all transform ${
                isPauseAnimating ? 'scale-105' : 'scale-100'
              } ${
                isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/50 hover:scale-105' 
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-700/50 hover:scale-105'
              }`}
              onClick={handlePauseToggle}
              style={{ minWidth: '220px' }}
            >
              {isPaused ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  RESUME
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  PAUSE
                </>
              )}
            </button>
          </div>
          
          <div className="text-gray-500 mt-10 text-center">
            <div className="mb-2">Keyboard Shortcuts:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-sm">
              <span className="bg-gray-800 px-3 py-1.5 rounded-md transition-all hover:bg-gray-700">Space: {isPaused ? 'Resume' : 'Pause'}</span>
              <span className="bg-gray-800 px-3 py-1.5 rounded-md transition-all hover:bg-gray-700">F: Fullscreen</span>
              <span className="bg-gray-800 px-3 py-1.5 rounded-md transition-all hover:bg-gray-700">←: Previous Level</span>
              <span className="bg-gray-800 px-3 py-1.5 rounded-md transition-all hover:bg-gray-700">→: Next Level</span>
            </div>
          </div>
        </div>
        
        {/* Powered by badge */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-500 opacity-70 hover:opacity-100 transition-opacity duration-300 flex items-center">
          <span className="mr-1 hidden md:inline">Powered by</span>
          <span className="font-bold">ETH.cash</span>
        </div>
      </div>
    );
  }
  
  // Non-fullscreen view
  return (
    <div className="w-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl tournament-clock">
      {/* Main Display */}
      <div className="p-4 md:p-6">
        {/* Level and Timer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/60 p-5 rounded-xl text-center flex flex-col justify-center transition-all hover:bg-gray-800/80">
            <div className="text-gray-400 text-sm mb-2">Level</div>
            <div className="text-2xl md:text-3xl font-bold text-white">
              {isBreak ? 'BREAK' : currentLevel}
            </div>
          </div>
          
          <div className="col-span-2 bg-gray-800/60 p-5 rounded-xl text-center relative group transition-all hover:bg-gray-800/80">
            <div className="text-gray-400 text-sm mb-2">{isBreak ? 'Break Ends In' : 'Time Remaining'}</div>
            <div className="text-3xl md:text-5xl font-bold text-white font-mono time-display">
              <span className={!isPaused ? "running-timer" : ""}>{formatTime(remainingTime)}</span>
            </div>
            
            {/* Pause overlay with enhanced animation */}
            <button 
              onClick={handlePauseToggle}
              className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span className={`flex items-center justify-center text-lg font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isPauseAnimating ? 'scale-110' : 'scale-100'
              } ${
                isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg' 
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              }`}>
                {isPaused ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    Resume
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/60 p-4 rounded-xl transition-all hover:bg-gray-800/80">
                <div className="text-gray-400 text-sm mb-1">Small Blind</div>
                <div className="text-xl font-bold text-white">{smallBlind}</div>
              </div>
              
              <div className="bg-gray-800/60 p-4 rounded-xl transition-all hover:bg-gray-800/80">
                <div className="text-gray-400 text-sm mb-1">Big Blind</div>
                <div className="text-xl font-bold text-white">{bigBlind}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gray-800/60 p-4 rounded-xl transition-all hover:bg-gray-800/80">
                <div className="text-gray-400 text-sm mb-1">Ante</div>
                <div className="text-xl font-bold text-white">{ante || '-'}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-800/60 p-4 rounded-xl transition-all hover:bg-gray-800/80">
              <div className="text-gray-400 text-sm mb-2">Current Ratio</div>
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
            
            <div className="bg-gray-800/60 p-4 rounded-xl transition-all hover:bg-gray-800/80">
              <div className="text-sm text-gray-400 mb-2">Status</div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${isPaused ? 'bg-red-500 pulse-animation' : 'bg-green-500'}`}></div>
                <div className="text-white font-bold">
                  {isPaused ? 'Paused' : isBreak ? 'On Break' : 'Running'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-span-2 md:col-span-1 bg-gray-800/60 p-5 rounded-xl transition-all hover:bg-gray-800/80">
          <div className="text-gray-400 text-sm mb-3 font-medium">Payouts</div>
          
          {displayPayouts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {displayPayouts.map(payout => (
                <div key={payout.position} className="flex justify-between items-center py-1">
                  <span className="text-sm flex items-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs font-bold
                      ${payout.position === 1 ? 'bg-amber-500/80' : 
                        payout.position === 2 ? 'bg-gray-400/80' : 
                          payout.position === 3 ? 'bg-amber-700/80' : 'bg-blue-600/80'}`}>
                      {payout.position}
                    </span>
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
      <div className="bg-gray-950 p-4 flex justify-between items-center">
        <div className="flex gap-3">
          <button 
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 button-hover-effect"
            onClick={onPrevLevel}
          >
            <span className="hidden md:inline">Previous Level</span>
            <span className="md:hidden">Prev</span>
          </button>
          
          <button 
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 button-hover-effect"
            onClick={onNextLevel}
          >
            <span className="hidden md:inline">Next Level</span>
            <span className="md:hidden">Next</span>
          </button>
        </div>
        
        <div className="flex gap-3">
          <button 
            className={`flex items-center justify-center py-2.5 px-5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
              isPaused 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
            }`}
            onClick={handlePauseToggle}
          >
            {isPaused ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                <span className="hidden md:inline">Resume</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden md:inline">Pause</span>
              </>
            )}
          </button>
          
          <button 
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium flex items-center transition-all duration-200 button-hover-effect"
            onClick={toggleFullscreen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        .time-pulse {
          animation: time-flash 1s infinite;
        }
        @keyframes time-flash {
          0%, 80% { opacity: 1; }
          40% { opacity: 0.95; }
        }
      `}</style>
    </div>
  );
};

export default TournamentClock; 