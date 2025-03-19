/**
 * Utilities for tournament clock state persistence
 */

// Constants for localStorage keys
export const CLOCK_STATE_PREFIX = 'tournament_clock_state_';
export const GLOBAL_CLOCK_STATE_KEY = 'tournament_clock_global_state';

// Type definitions
export interface ClockState {
  tournamentId: string;
  remainingTime: number;
  isPaused: boolean;
  currentLevel: number;
  lastPausedAt: number; // timestamp when last paused
  cumulativeElapsedTime: number;
  lastUpdated: number; // timestamp for when this state was last saved
}

/**
 * Save clock state to localStorage
 * @param tournamentId Tournament ID
 * @param state Clock state object to save
 */
export const saveClockState = (tournamentId: string, state: Partial<ClockState>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Create a complete state object
    const completeState: ClockState = {
      tournamentId,
      remainingTime: state.remainingTime || 0,
      isPaused: state.isPaused ?? true,
      currentLevel: state.currentLevel || 1,
      lastPausedAt: state.isPaused ? Date.now() : 0,
      cumulativeElapsedTime: state.cumulativeElapsedTime || 0,
      lastUpdated: Date.now()
    };
    
    // Save to both tournament-specific and global keys
    const tournamentKey = `${CLOCK_STATE_PREFIX}${tournamentId}`;
    
    localStorage.setItem(tournamentKey, JSON.stringify(completeState));
    localStorage.setItem(GLOBAL_CLOCK_STATE_KEY, JSON.stringify(completeState));
    
    console.log(`[PERSISTENCE] Saved clock state for tournament ${tournamentId}:`, completeState);
  } catch (error) {
    console.error('[PERSISTENCE] Error saving clock state:', error);
  }
};

/**
 * Get saved clock state from localStorage
 * @param tournamentId Tournament ID
 * @returns The saved clock state or null if not found
 */
export const getClockState = (tournamentId: string): ClockState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try tournament-specific state first
    const tournamentKey = `${CLOCK_STATE_PREFIX}${tournamentId}`;
    const savedStateJson = localStorage.getItem(tournamentKey);
    
    if (savedStateJson) {
      const savedState = JSON.parse(savedStateJson);
      console.log(`[PERSISTENCE] Retrieved clock state for tournament ${tournamentId}`);
      return savedState;
    }
    
    // Fall back to global state
    const globalStateJson = localStorage.getItem(GLOBAL_CLOCK_STATE_KEY);
    if (globalStateJson) {
      const globalState = JSON.parse(globalStateJson);
      console.log(`[PERSISTENCE] Retrieved global clock state, matches tournament: ${globalState.tournamentId === tournamentId}`);
      return globalState;
    }
    
    return null;
  } catch (error) {
    console.error('[PERSISTENCE] Error getting clock state:', error);
    return null;
  }
};

/**
 * Calculate adjusted remaining time based on saved state
 * Handles the case where time passed while app was closed or tab was inactive
 * @param savedState The saved clock state
 * @returns The adjusted remaining time in seconds
 */
export const calculateAdjustedRemainingTime = (savedState: ClockState): number => {
  if (!savedState) return 0;
  
  // If clock was paused, just return the saved time
  if (savedState.isPaused) {
    return savedState.remainingTime;
  }
  
  // Calculate elapsed time since last update
  const now = Date.now();
  const elapsedSinceLastUpdate = Math.floor((now - savedState.lastUpdated) / 1000);
  
  // Calculate new remaining time
  const adjustedRemainingTime = Math.max(0, savedState.remainingTime - elapsedSinceLastUpdate);
  
  console.log(`[PERSISTENCE] Calculated adjusted remaining time: ${adjustedRemainingTime}s (elapsed: ${elapsedSinceLastUpdate}s)`);
  
  return adjustedRemainingTime;
};

/**
 * Register event handlers for persistence across page reloads and tab switching
 * @param tournamentId Tournament ID
 * @param getCurrentState Function that returns the current clock state
 * @param onStateRestored Callback to handle restored state
 * @returns Cleanup function to unregister event handlers
 */
export const registerPersistenceHandlers = (
  tournamentId: string,
  getCurrentState: () => Partial<ClockState>,
  onStateRestored?: (state: ClockState) => void
): () => void => {
  if (typeof window === 'undefined') return () => {};
  
  // Save state before the page unloads
  const handleBeforeUnload = () => {
    console.log('[PERSISTENCE] Page unloading, saving state');
    saveClockState(tournamentId, getCurrentState());
  };
  
  // Handle tab visibility changes
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // Tab is hidden, save the current state
      console.log('[PERSISTENCE] Tab hidden, saving state');
      saveClockState(tournamentId, getCurrentState());
    } else if (document.visibilityState === 'visible') {
      // Tab is visible again, check for updated state
      console.log('[PERSISTENCE] Tab visible again, checking for updates');
      const savedState = getClockState(tournamentId);
      
      if (savedState && onStateRestored) {
        onStateRestored(savedState);
      }
    }
  };
  
  // Register event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}; 