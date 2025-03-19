'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TournamentClock from '../../components/TournamentClock';
import { useRouter } from 'next/router';

const ViewTournament = () => {
  // Tournament state (in a real app, this would come from a database)
  const [tournament, setTournament] = useState({
    id: '004',
    name: '$1,000 No-Limit Hold\'em',
    startingChips: 20000,
    entrants: 345,
    prizePool: 345000,
    payingPlaces: 54,
    currentLevel: 1,
    levelTime: 3600, // 60 minutes in seconds
    isPaused: false,
    nextBreak: 4,
    breakLength: 15,
    blinds: [
      { small: 25, big: 25 },
      { small: 25, big: 50 },
      { small: 50, big: 100 },
      { small: 75, big: 150 },
      { small: 100, big: 200 },
      { small: 150, big: 300 },
      { small: 200, big: 400 },
      { small: 250, big: 500 },
      { small: 300, big: 600 },
      { small: 400, big: 800 },
      { small: 500, big: 1000 },
      { small: 600, big: 1200 },
      { small: 800, big: 1600 },
      { small: 1000, big: 2000 },
      { small: 1200, big: 2400 },
      { small: 1500, big: 3000 },
      { small: 2000, big: 4000 },
      { small: 2500, big: 5000 },
      { small: 3000, big: 6000 },
      { small: 4000, big: 8000 },
    ],
    ante: [
      0, 0, 0, 0, 25, 25, 50, 50, 75, 100, 100, 
      200, 200, 300, 300, 400, 500, 500, 1000, 1000
    ],
    bringIn: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    remainingPlayers: 289,
    averageStack: 23875,
    tablesRemaining: 30,
    isBreak: false,
    announcements: [
      { time: '10:15 AM', message: 'Tournament has started' },
      { time: '12:30 PM', message: 'Registration closed after Level 6' },
      { time: '2:45 PM', message: 'Tables 1-5 have been consolidated' },
    ]
  });

  // Manage active tab
  const [activeTab, setActiveTab] = useState('clock');

  // Handle level change
  const handleLevelChange = (level: number) => {
    setTournament({
      ...tournament,
      currentLevel: level
    });
  };

  // Handle timer end
  const handleTimerEnd = () => {
    console.log('Timer ended for level', tournament.currentLevel);
    // Handle level end logic here
  };

  // Toggle pause state
  const togglePause = () => {
    setTournament({
      ...tournament,
      isPaused: !tournament.isPaused
    });
  };

  // Add a new announcement
  const [newAnnouncement, setNewAnnouncement] = useState('');
  
  const addAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTournament({
      ...tournament,
      announcements: [
        { time, message: newAnnouncement },
        ...tournament.announcements
      ]
    });
    setNewAnnouncement('');
  };

  // Get the tournament ID from the URL or use 'demo' as fallback
  const tournamentId = useRouter().query.id as string || 'demo';

  // Add this useEffect to save and restore the tournament state from localStorage
  useEffect(() => {
    // Function to save tournament state to localStorage
    const saveTournamentStateToLocalStorage = () => {
      if (tournament) {
        try {
          const state = {
            ...tournament,
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem(`tournament_state_${tournamentId}`, JSON.stringify(state));
          console.log(`[TOURNAMENT] 💾 Saved tournament state to localStorage`);
        } catch (error) {
          console.error('[TOURNAMENT] ❌ Error saving tournament state:', error);
        }
      }
    };

    // Save state before the page unloads
    window.addEventListener('beforeunload', saveTournamentStateToLocalStorage);
    
    // Also save on visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveTournamentStateToLocalStorage();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Try to restore state on component mount
    const restoreTournamentState = () => {
      try {
        const savedStateJson = localStorage.getItem(`tournament_state_${tournamentId}`);
        if (savedStateJson) {
          const savedState = JSON.parse(savedStateJson);
          console.log(`[TOURNAMENT] 📋 Restored tournament state from localStorage`);
          setTournament(savedState);
        }
      } catch (error) {
        console.error('[TOURNAMENT] ❌ Error restoring tournament state:', error);
      }
    };
    
    restoreTournamentState();
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', saveTournamentStateToLocalStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tournamentId, tournament]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
              PokerPro
            </Link>
            <nav className="hidden md:flex gap-6">
              <button 
                className={`px-3 py-2 ${activeTab === 'clock' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('clock')}
              >
                Tournament Clock
              </button>
              <button 
                className={`px-3 py-2 ${activeTab === 'players' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('players')}
              >
                Players
              </button>
              <button 
                className={`px-3 py-2 ${activeTab === 'tables' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('tables')}
              >
                Tables
              </button>
              <button 
                className={`px-3 py-2 ${activeTab === 'payouts' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('payouts')}
              >
                Payouts
              </button>
            </nav>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={togglePause}
              className={`${tournament.isPaused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded-lg font-medium`}
            >
              {tournament.isPaused ? 'Resume' : 'Pause'}
            </button>
            <Link 
              href="/tournament/settings"
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Tab Selector */}
      <div className="md:hidden bg-gray-900 p-2 border-b border-gray-800 overflow-x-auto">
        <div className="flex">
          <button 
            className={`px-3 py-2 whitespace-nowrap ${activeTab === 'clock' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('clock')}
          >
            Tournament Clock
          </button>
          <button 
            className={`px-3 py-2 whitespace-nowrap ${activeTab === 'players' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('players')}
          >
            Players
          </button>
          <button 
            className={`px-3 py-2 whitespace-nowrap ${activeTab === 'tables' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('tables')}
          >
            Tables
          </button>
          <button 
            className={`px-3 py-2 whitespace-nowrap ${activeTab === 'payouts' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('payouts')}
          >
            Payouts
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Tournament Clock Tab */}
          {activeTab === 'clock' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <TournamentClock 
                  currentLevel={tournament.currentLevel}
                  smallBlind={tournament.blinds[tournament.currentLevel - 1].small}
                  bigBlind={tournament.blinds[tournament.currentLevel - 1].big}
                  ante={tournament.ante[tournament.currentLevel - 1]}
                  timeRemaining={tournament.levelTime}
                  isBreak={tournament.isBreak}
                  isPaused={tournament.isPaused}
                  prizePool={tournament.prizePool}
                  onTimerEnd={handleTimerEnd}
                  onPauseToggle={togglePause}
                  onNextLevel={() => handleLevelChange(tournament.currentLevel + 1)}
                  onPrevLevel={() => handleLevelChange(tournament.currentLevel - 1)}
                />
              </div>
              
              <div className="space-y-6">
                {/* Tournament Stats */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Tournament Stats</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">Players Remaining</div>
                      <div className="text-xl font-bold text-white">{tournament.remainingPlayers}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm">Tables Remaining</div>
                      <div className="text-xl font-bold text-white">{tournament.tablesRemaining}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm">Average Stack</div>
                      <div className="text-xl font-bold text-white">{tournament.averageStack.toLocaleString()}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm">Players Paid</div>
                      <div className="text-xl font-bold text-white">
                        {tournament.entrants - tournament.remainingPlayers > tournament.entrants - tournament.payingPlaces
                          ? tournament.entrants - tournament.remainingPlayers - (tournament.entrants - tournament.payingPlaces)
                          : 0}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Announcements */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Announcements</h2>
                  
                  <div className="mb-4 flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
                      placeholder="New announcement..."
                      value={newAnnouncement}
                      onChange={(e) => setNewAnnouncement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAnnouncement()}
                    />
                    <button 
                      onClick={addAnnouncement}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {tournament.announcements.map((announcement, index) => (
                      <div key={index} className="bg-gray-700 p-3 rounded-lg">
                        <div className="font-medium">{announcement.message}</div>
                        <div className="text-xs text-gray-400">{announcement.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg font-medium">
                      Register Player
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg font-medium">
                      Eliminate Player
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg font-medium">
                      Balance Tables
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg font-medium">
                      Add Rebuy
                    </button>
                    <button className="col-span-2 bg-blue-700 hover:bg-blue-600 text-white p-3 rounded-lg font-medium">
                      Display on Secondary Screen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Other tabs (placeholders) */}
          {activeTab === 'players' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Players</h2>
              <p className="text-gray-400">Player management would be displayed here, including registrations, eliminations, and player status.</p>
            </div>
          )}
          
          {activeTab === 'tables' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Tables</h2>
              <p className="text-gray-400">Table management would be displayed here, including table balancing, seat assignments, and table status.</p>
            </div>
          )}
          
          {activeTab === 'payouts' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Payouts</h2>
              <p className="text-gray-400">Payout structure and winners would be displayed here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewTournament; 