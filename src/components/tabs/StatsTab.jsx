import { useState, useEffect } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import AdvancedAnalytics from './AdvancedAnalytics';
import EnhancedDashboard from '../EnhancedDashboard';
import PlayerPerformanceAnalytics from './enhanced/PlayerPerformanceAnalytics';
import MatchPredictionEngine from './enhanced/MatchPredictionEngine';
import EnhancedFinancialAnalytics from './enhanced/EnhancedFinancialAnalytics';
import { 
  loadCalculatorValues, 
  updateCalculatorValues, 
  setDrinkingStartTime,
  getHoursSinceDrinkingStarted,
  updateCumulativeShotsFromMatches
} from '../../utils/alcoholCalculatorPersistence';

// Enhanced Statistics Calculator Class (ported from vanilla JS)
class StatsCalculator {
  constructor(matches, players, bans, spielerDesSpiels) {
    this.matches = matches || [];
    this.players = players || [];
    this.bans = bans || [];
    this.spielerDesSpiels = spielerDesSpiels || [];
    this.aekPlayers = (players || []).filter(p => p.team === "AEK");
    this.realPlayers = (players || []).filter(p => p.team === "Real");
  }

  calculateTeamRecords() {
    const aekRecord = { wins: 0, losses: 0 };
    const realRecord = { wins: 0, losses: 0 };

    this.matches.forEach(match => {
      const aekGoals = match.goalsa || 0;
      const realGoals = match.goalsb || 0;

      if (aekGoals > realGoals) {
        aekRecord.wins++;
        realRecord.losses++;
      } else if (realGoals > aekGoals) {
        realRecord.wins++;
        aekRecord.losses++;
      }
    });

    return { aek: aekRecord, real: realRecord };
  }

  calculateRecentForm(teamCount = 5) {
    const recentMatches = this.matches.slice(-teamCount);
    const aekForm = [];
    const realForm = [];

    recentMatches.forEach(match => {
      const aekGoals = match.goalsa || 0;
      const realGoals = match.goalsb || 0;

      if (aekGoals > realGoals) {
        aekForm.push('W');
        realForm.push('L');
      } else if (realGoals > aekGoals) {
        aekForm.push('L');
        realForm.push('W');
      } else {
        aekForm.push('D');
        realForm.push('D');
      }
    });

    return { aek: aekForm, real: realForm };
  }

  calculatePlayerStats() {
    return this.players.map(player => {
      const matchesPlayed = this.countPlayerMatches();
      const playerBans = this.bans.filter(b => b.player_id === player.id);
      
      const sdsRecord = this.spielerDesSpiels.find(sds => 
        sds.name === player.name && sds.team === player.team
      );
      const sdsCount = sdsRecord ? (sdsRecord.count || 0) : 0;
      
      return {
        ...player,
        // Use database goals instead of calculated match goals
        goals: player.goals || 0,
        matchesPlayed,
        sdsCount,
        goalsPerGame: matchesPlayed > 0 ? ((player.goals || 0) / matchesPlayed).toFixed(2) : '0.00',
        totalBans: playerBans.length,
        disciplinaryScore: this.calculateDisciplinaryScore(playerBans)
      };
    }).sort((a, b) => (b.goals || 0) - (a.goals || 0));
  }

  countPlayerGoalsFromMatches(playerName, playerTeam) {
    let totalGoals = 0;
    
    this.matches.forEach(match => {
      if (playerTeam === 'AEK' && match.goalslista) {
        const goals = Array.isArray(match.goalslista) ? match.goalslista : 
                     (typeof match.goalslista === 'string' ? JSON.parse(match.goalslista) : []);
        
        goals.forEach(goal => {
          const goalPlayer = typeof goal === 'string' ? goal : goal.player;
          const goalCount = typeof goal === 'string' ? 1 : (goal.count || 1);
          if (goalPlayer === playerName) totalGoals += goalCount;
        });
      }
      
      if (playerTeam === 'Real' && match.goalslistb) {
        const goals = Array.isArray(match.goalslistb) ? match.goalslistb : 
                     (typeof match.goalslistb === 'string' ? JSON.parse(match.goalslistb) : []);
        
        goals.forEach(goal => {
          const goalPlayer = typeof goal === 'string' ? goal : goal.player;
          const goalCount = typeof goal === 'string' ? 1 : (goal.count || 1);
          if (goalPlayer === playerName) totalGoals += goalCount;
        });
      }
    });
    
    return totalGoals;
  }

  countPlayerMatches() {
    // For now, assume all players participated in all matches
    // In a real implementation, you'd track participation per match
    return this.matches.length;
  }

  calculateDisciplinaryScore(bans) {
    let score = 0;
    bans.forEach(ban => {
      switch (ban.type) {
        case 'Gelb-Rote Karte': score += 3; break;
        case 'Rote Karte': score += 5; break;
        case 'Verletzung': score += 1; break;
        default: score += 1;
      }
    });
    return score;
  }

  calculateAdvancedStats() {
    const totalMatches = this.matches.length;
    const totalGoals = this.matches.reduce((sum, m) => sum + (m.goalsa || 0) + (m.goalsb || 0), 0);
    
    return {
      avgGoalsPerMatch: totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : '0.00',
      totalMatches,
      totalGoals,
      aekTotalGoals: this.matches.reduce((sum, m) => sum + (m.goalsa || 0), 0),
      realTotalGoals: this.matches.reduce((sum, m) => sum + (m.goalsb || 0), 0),
      highestScoringMatch: totalMatches > 0 ? Math.max(...this.matches.map(m => (m.goalsa || 0) + (m.goalsb || 0))) : 0,
      cleanSheets: {
        aek: this.matches.filter(m => m.goalsb === 0).length,
        real: this.matches.filter(m => m.goalsa === 0).length
      }
    };
  }

  calculatePerformanceTrends() {
    const monthlyStats = {};
    
    this.matches.forEach(match => {
      const date = new Date(match.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          aekWins: 0,
          realWins: 0,
          totalGoals: 0,
          matchCount: 0
        };
      }
      
      const aekGoals = match.goalsa || 0;
      const realGoals = match.goalsb || 0;
      
      monthlyStats[monthKey].totalGoals += aekGoals + realGoals;
      monthlyStats[monthKey].matchCount++;
      
      if (aekGoals > realGoals) monthlyStats[monthKey].aekWins++;
      else if (realGoals > aekGoals) monthlyStats[monthKey].realWins++;
    });

    return monthlyStats;
  }

  // Head-to-head statistics with biggest wins for each team
  calculateHeadToHead() {
    const h2h = {
      totalMatches: this.matches.length,
      aekWins: 0,
      realWins: 0,
      aekGoals: 0,
      realGoals: 0,
      biggestAekWin: { diff: 0, score: '', date: '', opponent: 'Real Madrid' },
      biggestRealWin: { diff: 0, score: '', date: '', opponent: 'AEK Athen' }
    };

    this.matches.forEach(match => {
      const aekGoals = match.goalsa || 0;
      const realGoals = match.goalsb || 0;
      const diff = Math.abs(aekGoals - realGoals);

      h2h.aekGoals += aekGoals;
      h2h.realGoals += realGoals;

      if (aekGoals > realGoals) {
        h2h.aekWins++;
        if (diff > h2h.biggestAekWin.diff) {
          h2h.biggestAekWin = {
            diff,
            score: `${aekGoals}:${realGoals}`,
            date: match.date || '',
            opponent: 'Real Madrid'
          };
        }
      } else if (realGoals > aekGoals) {
        h2h.realWins++;
        if (diff > h2h.biggestRealWin.diff) {
          h2h.biggestRealWin = {
            diff,
            score: `${realGoals}:${aekGoals}`,
            date: match.date || '',
            opponent: 'AEK Athen'
          };
        }
      }
    });

    return h2h;
  }
}

// Alcohol conversion utilities
const alcoholUtils = {
  clToLiters: (cl) => (cl / 100).toFixed(3),
  clToShots: (cl) => (cl / 2).toFixed(0), // 2cl per shot
  clToGlasses: (cl) => (cl / 20).toFixed(1), // 20cl per glass
  formatAlcoholDisplay: (cl) => ({
    cl,
    liters: (cl / 100).toFixed(3),
    shots: Math.floor(cl / 2),
    glasses: (cl / 20).toFixed(1)
  })
};

export default function StatsTab({ onNavigate }) {
  const [selectedView, setSelectedView] = useState('dashboard');
  // Load manager settings from localStorage and merge with defaults
  const loadManagerSettings = () => {
    try {
      const savedManagers = localStorage.getItem('teamManagers');
      if (savedManagers) {
        const parsedManagers = JSON.parse(savedManagers);
        return {
          aekChef: { 
            name: parsedManagers.aek?.name || 'Alexander', 
            weight: parsedManagers.aek?.weight || 100, 
            gender: 'male' 
          },
          realChef: { 
            name: parsedManagers.real?.name || 'Philip', 
            weight: parsedManagers.real?.weight || 105, 
            gender: 'male' 
          }
        };
      }
    } catch (e) {
      console.error('Error loading manager settings:', e);
    }
    // Return defaults if no saved settings or error
    return {
      aekChef: { name: 'Alexander', weight: 100, gender: 'male' },
      realChef: { name: 'Philip', weight: 105, gender: 'male' }
    };
  };

  // Alcohol calculator state - loaded from persistence and merged with manager settings
  const [calculatorValues, setCalculatorValues] = useState(() => {
    const persistedValues = loadCalculatorValues();
    return {
      ...persistedValues,
      playerData: loadManagerSettings() // Always load fresh manager settings
    };
  });
  
  const { data: matches, loading: matchesLoading } = useSupabaseQuery('matches', '*');
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  const { data: sdsData, loading: sdsLoading } = useSupabaseQuery('spieler_des_spiels', '*');
  const { data: bans, loading: bansLoading } = useSupabaseQuery('bans', '*');
  
  // Listen for changes to manager settings in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setCalculatorValues(prev => ({
        ...prev,
        playerData: loadManagerSettings()
      }));
    };

    // Listen for localStorage changes (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the same window
    window.addEventListener('managerSettingsChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('managerSettingsChanged', handleStorageChange);
    };
  }, []);

  // Helper function to update calculator values with persistence
  const updateCalculatorValuesWithPersistence = (updates) => {
    setCalculatorValues(prev => {
      const updated = updateCalculatorValues(updates, prev);
      return updated;
    });
  };

  // Effect to update cumulative shots when matches are loaded
  useEffect(() => {
    if (matches && matches.length > 0) {
      // Check if we need to update cumulative shots
      const latestMatch = matches.reduce((latest, match) => {
        return (!latest || match.id > latest.id) ? match : latest;
      }, null);
      
      // Update cumulative shots if there's a new match or no cumulative data
      if (latestMatch && 
          (!calculatorValues.cumulativeShots.lastMatchId || 
           calculatorValues.cumulativeShots.lastMatchId < latestMatch.id ||
           calculatorValues.cumulativeShots.total === 0)) {
        
        const updatedValues = updateCumulativeShotsFromMatches(matches, calculatorValues);
        setCalculatorValues(updatedValues);
      }
    }
  }, [matches, calculatorValues]); // Depend on matches array and calculatorValues
  
  const loading = matchesLoading || playersLoading || sdsLoading || bansLoading;

  // Initialize statistics calculator
  const stats = new StatsCalculator(matches, players, bans, sdsData);
  
  // Calculate all statistics
  const teamRecords = stats.calculateTeamRecords();
  const recentForm = stats.calculateRecentForm(5);
  const playerStats = stats.calculatePlayerStats();
  const advancedStats = stats.calculateAdvancedStats();
  const performanceTrends = stats.calculatePerformanceTrends();
  const headToHead = stats.calculateHeadToHead();

  // Basic data calculations
  const totalMatches = matches?.length || 0;
  const aekPlayers = players?.filter(p => p.team === 'AEK') || [];
  const realPlayers = players?.filter(p => p.team === 'Real') || [];

  // Calculate market values
  const aekMarketValue = aekPlayers.reduce((total, player) => total + (player.value || 0), 0);
  const realMarketValue = realPlayers.reduce((total, player) => total + (player.value || 0), 0);
  const totalMarketValue = aekMarketValue + realMarketValue;

  // Calculate wins per team 
  const aekWins = teamRecords.aek.wins;
  const realWins = teamRecords.real.wins;

  const formatForm = (form) => {
    return form.map((result, index) => (
      <span
        key={index}
        className={`inline-block w-6 h-6 text-xs font-bold rounded-full text-center leading-6 mx-0.5 ${
          result === 'W' ? 'bg-green-500 text-white' :
          result === 'L' ? 'bg-red-500 text-white' :
          'bg-gray-400 text-white'
        }`}
      >
        {result}
      </span>
    ));
  };

  const formatPlayerValue = (value) => {
    // Helper function for consistent player value formatting
    // Values are stored as millions in database  
    return `${(value || 0).toFixed(1)}M €`;
  };

  const views = [
    { id: 'dashboard', label: 'Dashboard', icon: '🎯' },
    { id: 'overview', label: 'Übersicht', icon: '📊' },
    { id: 'players', label: 'Spieler', icon: '👥' },
    { id: 'teams', label: 'Teams', icon: '🏆' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'alkohol', label: 'Alkohol', icon: '🍺' },
    { id: 'advanced', label: 'Erweitert', icon: '🔬' },
    { id: 'playeranalytics', label: 'Spieler-Analytics', icon: '🎯' },
    { id: 'matchprediction', label: 'Match-Prediction', icon: '🔮' },
    { id: 'financialanalytics', label: 'Finanz-Analytics', icon: '💰' },
  ];

  if (loading) {
    return <LoadingSpinner message="Lade Statistiken..." />;
  }

  const renderOverview = () => {
    // Calculate enhanced statistics for the selected time period
    const topScorer = playerStats.length > 0 ? playerStats[0] : null;
    const topSdSPlayer = playerStats
      .filter(p => p.sdsCount > 0)
      .sort((a, b) => b.sdsCount - a.sdsCount)[0];
    
    // Calculate player with most goals in a single match
    const mostGoalsInMatch = matches?.reduce((max, match) => {
      const processGoalsList = (goalsList) => {
        if (!goalsList) return [];
        try {
          return typeof goalsList === 'string' ? JSON.parse(goalsList) : goalsList;
        } catch {
          return [];
        }
      };
      
      const aekGoals = processGoalsList(match.goalslista);
      const realGoals = processGoalsList(match.goalslistb);
      
      [...aekGoals, ...realGoals].forEach(goal => {
        const player = typeof goal === 'object' ? goal.player : goal;
        const count = typeof goal === 'object' ? goal.count : 1;
        if (count > max.count) {
          max = { player, count, match };
        }
      });
      
      return max;
    }, { player: null, count: 0, match: null });

    return (
      <div className="space-y-6">
        {/* Consolidated Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="modern-card text-center">
            <div className="text-2xl font-bold text-primary-green">{totalMatches}</div>
            <div className="text-sm text-text-muted">Spiele gespielt</div>
          </div>
          <div className="modern-card text-center">
            <div className="text-2xl font-bold text-primary-green">{advancedStats.totalGoals}</div>
            <div className="text-sm text-text-muted">Tore insgesamt</div>
            <div className="text-xs text-text-muted mt-1">
              ⌀ {totalMatches > 0 ? (advancedStats.totalGoals / totalMatches).toFixed(1) : '0.0'}/Spiel
            </div>
          </div>
          <div className="modern-card text-center">
            <div className="text-lg font-bold text-primary-green">
              {topScorer ? topScorer.name : 'Keine Daten'}
            </div>
            <div className="text-sm text-text-muted">
              🥇 Topscorer ({topScorer ? topScorer.goals : 0} Tore)
            </div>
            <div className="text-xs text-text-muted mt-1">
              {topScorer && topScorer.matchesPlayed > 0 ? 
                `⌀ ${(topScorer.goals / topScorer.matchesPlayed).toFixed(2)}/Spiel` : 
                '⌀ 0.00/Spiel'
              }
            </div>
          </div>
          <div className="modern-card text-center">
            <div className="text-lg font-bold text-primary-green">
              {topSdSPlayer ? topSdSPlayer.name : 'Keine Daten'}
            </div>
            <div className="text-sm text-text-muted">
              ⭐ Top SdS ({topSdSPlayer ? topSdSPlayer.sdsCount : 0}x)
            </div>
            <div className="text-xs text-text-muted mt-1">
              {topSdSPlayer && topSdSPlayer.matchesPlayed > 0 ? 
                `${((topSdSPlayer.sdsCount / topSdSPlayer.matchesPlayed) * 100).toFixed(1)}% Quote` : 
                '0.0% Quote'
              }
            </div>
          </div>
        </div>

        {/* New Enhanced Statistics Row - Team-specific highest wins */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card text-center">
            <div className="text-xl font-bold text-blue-600">
              {headToHead.biggestAekWin.diff > 0 ? headToHead.biggestAekWin.score : '–'}
            </div>
            <div className="text-sm text-text-muted">🔵 Größter AEK Sieg</div>
            {headToHead.biggestAekWin.diff > 0 && (
              <div className="text-xs text-text-muted mt-1">
                vs {headToHead.biggestAekWin.opponent}<br/>
                {new Date(headToHead.biggestAekWin.date).toLocaleDateString('de-DE')}
              </div>
            )}
          </div>
          <div className="modern-card text-center">
            <div className="text-xl font-bold text-red-600">
              {headToHead.biggestRealWin.diff > 0 ? headToHead.biggestRealWin.score : '–'}
            </div>
            <div className="text-sm text-text-muted">🔴 Größter Real Sieg</div>
            {headToHead.biggestRealWin.diff > 0 && (
              <div className="text-xs text-text-muted mt-1">
                vs {headToHead.biggestRealWin.opponent}<br/>
                {new Date(headToHead.biggestRealWin.date).toLocaleDateString('de-DE')}
              </div>
            )}
          </div>
          <div className="modern-card text-center">
            <div className="text-xl font-bold text-accent-blue">
              {mostGoalsInMatch?.player || 'Keine Daten'}
            </div>
            <div className="text-sm text-text-muted">
              ⚽ Meiste Tore ({mostGoalsInMatch?.count || 0} in einem Spiel)
            </div>
            {mostGoalsInMatch?.match && (
              <div className="text-xs text-text-muted mt-1">
                {new Date(mostGoalsInMatch.match.date).toLocaleDateString('de-DE')}
              </div>
            )}
          </div>
          <div className="modern-card text-center">
            <div className="text-xl font-bold text-accent-red">
              {(() => {
                // Calculate most suspended player
                const suspensionCounts = {};
                bans?.forEach(ban => {
                  const playerInfo = players?.find(p => p.id === ban.player_id);
                  const playerName = playerInfo?.name || 'Unbekannt';
                  suspensionCounts[playerName] = (suspensionCounts[playerName] || 0) + 1;
                });
                
                const mostSuspended = Object.entries(suspensionCounts)
                  .sort((a, b) => b[1] - a[1])[0];
                
                return mostSuspended ? mostSuspended[0] : 'Keine Daten';
              })()}
            </div>
            <div className="text-sm text-text-muted">
              🟥 Meiste Sperren ({(() => {
                const suspensionCounts = {};
                bans?.forEach(ban => {
                  const playerInfo = players?.find(p => p.id === ban.player_id);
                  const playerName = playerInfo?.name || 'Unbekannt';
                  suspensionCounts[playerName] = (suspensionCounts[playerName] || 0) + 1;
                });
                
                const mostSuspended = Object.entries(suspensionCounts)
                  .sort((a, b) => b[1] - a[1])[0];
                
                return mostSuspended ? mostSuspended[1] : 0;
              })()}x)
            </div>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="modern-card">
          <h3 className="font-bold text-lg mb-4">📊 Erweiterte Statistiken</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-bg-secondary rounded-lg">
              <div className="text-xl font-bold text-primary-green">
                {(() => {
                  // Calculate average suspension length
                  const totalDays = bans?.reduce((sum, ban) => {
                    const start = new Date(ban.start_date);
                    const end = new Date(ban.end_date);
                    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    return sum + (days > 0 ? days : 0);
                  }, 0) || 0;
                  
                  const avgDays = bans?.length > 0 ? (totalDays / bans.length).toFixed(1) : '0.0';
                  return `${avgDays} Tage`;
                })()}
              </div>
              <div className="text-sm text-text-muted">⌀ Sperrenlänge</div>
            </div>

            <div className="text-center p-3 bg-bg-secondary rounded-lg">
              <div className="text-xl font-bold text-accent-blue">
                {playerStats.filter(p => p.goals > 0).length}
              </div>
              <div className="text-sm text-text-muted">Aktive Torschützen</div>
            </div>
            <div className="text-center p-3 bg-bg-secondary rounded-lg">
              <div className="text-xl font-bold text-accent-red">
                {bans?.length || 0}
              </div>
              <div className="text-sm text-text-muted">Gesamt Sperren</div>
            </div>
          </div>
        </div>

        {/* New Interesting Statistics */}
        <div className="modern-card">
          <h3 className="font-bold text-lg mb-4">💡 Besondere Statistiken</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-xl font-bold text-green-600">
                {(() => {
                  // Calculate longest winning streak
                  let maxStreak = 0;
                  let currentAekStreak = 0;
                  let currentRealStreak = 0;
                  
                  matches?.forEach(match => {
                    const aekGoals = match.goalsa || 0;
                    const realGoals = match.goalsb || 0;
                    
                    if (aekGoals > realGoals) {
                      currentAekStreak++;
                      currentRealStreak = 0;
                      if (currentAekStreak > maxStreak) {
                        maxStreak = currentAekStreak;
                      }
                    } else if (realGoals > aekGoals) {
                      currentRealStreak++;
                      currentAekStreak = 0;
                      if (currentRealStreak > maxStreak) {
                        maxStreak = currentRealStreak;
                      }
                    } else {
                      currentAekStreak = 0;
                      currentRealStreak = 0;
                    }
                  });
                  
                  return maxStreak;
                })()}
              </div>
              <div className="text-sm text-green-700">🔥 Längste Siegesserie</div>
              <div className="text-xs text-green-600 mt-1">
                {(() => {
                  let maxStreak = 0;
                  let currentAekStreak = 0;
                  let currentRealStreak = 0;
                  let maxTeam = '';
                  
                  matches?.forEach(match => {
                    const aekGoals = match.goalsa || 0;
                    const realGoals = match.goalsb || 0;
                    
                    if (aekGoals > realGoals) {
                      currentAekStreak++;
                      currentRealStreak = 0;
                      if (currentAekStreak > maxStreak) {
                        maxStreak = currentAekStreak;
                        maxTeam = 'AEK';
                      }
                    } else if (realGoals > aekGoals) {
                      currentRealStreak++;
                      currentAekStreak = 0;
                      if (currentRealStreak > maxStreak) {
                        maxStreak = currentRealStreak;
                        maxTeam = 'Real';
                      }
                    } else {
                      currentAekStreak = 0;
                      currentRealStreak = 0;
                    }
                  });
                  
                  return maxTeam || 'Keine';
                })()}
              </div>
            </div>

            <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="text-xl font-bold text-yellow-600">
                {(() => {
                  // Calculate most productive player (goals per match played)
                  let bestRatio = 0;
                  
                  playerStats.forEach(player => {
                    if (player.matchesPlayed > 0) {
                      const ratio = player.goals / player.matchesPlayed;
                      if (ratio > bestRatio) {
                        bestRatio = ratio;
                      }
                    }
                  });
                  
                  return bestRatio.toFixed(2);
                })()}
              </div>
              <div className="text-sm text-yellow-700">⚡ Höchste Effizienz</div>
              <div className="text-xs text-yellow-600 mt-1">
                {(() => {
                  let bestRatio = 0;
                  let bestPlayer = null;
                  
                  playerStats.forEach(player => {
                    if (player.matchesPlayed > 0) {
                      const ratio = player.goals / player.matchesPlayed;
                      if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestPlayer = player.name;
                      }
                    }
                  });
                  
                  return bestPlayer || 'Keine Daten';
                })()}
              </div>
            </div>

            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="text-xl font-bold text-blue-600">
                {(() => {
                  // Calculate team balance (how close teams are in wins)
                  const aekWins = teamRecords.aek.wins;
                  const realWins = teamRecords.real.wins;
                  const totalDecisiveMatches = aekWins + realWins;
                  
                  if (totalDecisiveMatches === 0) return '100%';
                  
                  const balanceRatio = Math.min(aekWins, realWins) / Math.max(aekWins, realWins);
                  return `${(balanceRatio * 100).toFixed(0)}%`;
                })()}
              </div>
              <div className="text-sm text-blue-700">⚖️ Team-Balance</div>
              <div className="text-xs text-blue-600 mt-1">
                Ausgeglichenheit ({teamRecords.aek.wins}:{teamRecords.real.wins})
              </div>
            </div>
          </div>
        </div>

      {/* Team Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="modern-card border-l-4 border-blue-400">
          <h3 className="font-bold text-lg mb-4 text-blue-600">AEK Athen</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Siege:</span>
              <span className="font-semibold text-green-600">{aekWins}</span>
            </div>
            <div className="flex justify-between">
              <span>Niederlagen:</span>
              <span className="font-semibold text-red-600">{teamRecords.aek.losses}</span>
            </div>
            <div className="flex justify-between">
              <span>Marktwert:</span>
              <span className="font-semibold">{formatPlayerValue(aekMarketValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Zu Null:</span>
              <span className="font-semibold">{advancedStats.cleanSheets.aek}</span>
            </div>
            <div className="mt-3">
              <div className="text-sm text-text-muted mb-1">Form (letzte 5):</div>
              <div className="flex">{formatForm(recentForm.aek)}</div>
            </div>
          </div>
        </div>

        <div className="modern-card border-l-4 border-red-400">
          <h3 className="font-bold text-lg mb-4 text-red-600">Real Madrid</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Siege:</span>
              <span className="font-semibold text-green-600">{realWins}</span>
            </div>
            <div className="flex justify-between">
              <span>Niederlagen:</span>
              <span className="font-semibold text-red-600">{teamRecords.real.losses}</span>
            </div>
            <div className="flex justify-between">
              <span>Marktwert:</span>
              <span className="font-semibold">{formatPlayerValue(realMarketValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Zu Null:</span>
              <span className="font-semibold">{advancedStats.cleanSheets.real}</span>
            </div>
            <div className="mt-3">
              <div className="text-sm text-text-muted mb-1">Form (letzte 5):</div>
              <div className="flex">{formatForm(recentForm.real)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="modern-card">
        <h3 className="font-bold text-lg mb-4">🏆 Top-Torschützen</h3>
        <div className="space-y-2">
          {playerStats.slice(0, 5).map((player, index) => (
            <div key={player.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-b-0">
              <div className="flex items-center space-x-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-text-muted">{player.team}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{player.goals} Tore</div>
                <div className="text-sm text-text-muted">{player.goalsPerGame} ⌀</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Spieler des Spiels */}
      <div className="modern-card">
        <h3 className="font-bold text-lg mb-4">⭐ Top-Spieler des Spiels</h3>
        <div className="space-y-2">
          {playerStats
            .filter(player => player.sdsCount > 0)
            .sort((a, b) => b.sdsCount - a.sdsCount)
            .slice(0, 5)
            .map((player, index) => (
            <div key={player.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-b-0">
              <div className="flex items-center space-x-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-text-muted">{player.team}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{player.sdsCount}x SdS</div>
                <div className="text-sm text-text-muted">
                  {player.matchesPlayed > 0 ? ((player.sdsCount / player.matchesPlayed) * 100).toFixed(1) : '0.0'}% Quote
                </div>
              </div>
            </div>
          ))}
        </div>
        {playerStats.filter(player => player.sdsCount > 0).length === 0 && (
          <div className="text-center text-text-muted py-4">
            Noch keine Spieler des Spiels Auszeichnungen vergeben
          </div>
        )}
      </div>
    </div>
  );
};

  const renderPlayers = () => (
    <div className="modern-card">
      <h3 className="font-bold text-lg mb-4">📊 Spielerstatistiken</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left py-2">Spieler</th>
              <th className="text-left py-2">Team</th>
              <th className="text-center py-2">Tore</th>
              <th className="text-center py-2">⌀/Spiel</th>
              <th className="text-center py-2">SdS</th>
              <th className="text-center py-2">Sperren</th>
              <th className="text-right py-2">Marktwert</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((player) => (
              <tr key={player.id} className="border-b border-border-light hover:bg-bg-secondary">
                <td className="py-2 font-medium">{player.name}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    player.team === 'AEK' ? 'bg-blue-100 text-blue-800' : 
                    player.team === 'Ehemalige' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {player.team}
                  </span>
                </td>
                <td className="py-2 text-center font-bold">{player.goals}</td>
                <td className="py-2 text-center">{player.goalsPerGame}</td>
                <td className="py-2 text-center">{player.sdsCount}</td>
                <td className="py-2 text-center">{player.totalBans}</td>
                <td className="py-2 text-right">{formatPlayerValue(player.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6">
      {/* Team Comparison */}
      <div className="modern-card">
        <h3 className="font-bold text-lg mb-4">⚖️ Team-Vergleich</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-blue-600">AEK Athen</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Aktive Spieler:</span>
                <span className="font-medium">{aekPlayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Siege:</span>
                <span className="font-medium">{aekWins}</span>
              </div>
              <div className="flex justify-between">
                <span>Niederlagen:</span>
                <span className="font-medium">{teamRecords.aek.losses}</span>
              </div>
              <div className="flex justify-between">
                <span>Gesamtmarktwert:</span>
                <span className="font-medium">{formatPlayerValue(aekMarketValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Zu Null Spiele:</span>
                <span className="font-medium">{advancedStats.cleanSheets.aek}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-red-600">Real Madrid</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Aktive Spieler:</span>
                <span className="font-medium">{realPlayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Siege:</span>
                <span className="font-medium">{realWins}</span>
              </div>
              <div className="flex justify-between">
                <span>Niederlagen:</span>
                <span className="font-medium">{teamRecords.real.losses}</span>
              </div>
              <div className="flex justify-between">
                <span>Gesamtmarktwert:</span>
                <span className="font-medium">{formatPlayerValue(realMarketValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Zu Null Spiele:</span>
                <span className="font-medium">{advancedStats.cleanSheets.real}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Team Stats */}
      <div className="modern-card">
        <h3 className="font-bold text-lg mb-4">📈 Erweiterte Statistiken</h3>
        <div className="mb-4 text-sm text-text-muted">
          Diese Statistiken bieten tiefere Einblicke in die Team-Performance und wichtige Kennzahlen.
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary-green">{advancedStats.highestScoringMatch}</div>
            <div className="text-sm text-text-muted">Höchste Toranzahl</div>
            <div className="text-xs text-text-muted mt-1">in einem einzelnen Spiel</div>
          </div>
          <div className="text-center p-4 bg-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary-green">{formatPlayerValue(totalMarketValue)}</div>
            <div className="text-sm text-text-muted">Gesamtmarktwert</div>
            <div className="text-xs text-text-muted mt-1">aller aktiven Spieler</div>
          </div>
          <div className="text-center p-4 bg-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-accent-orange">{Math.abs(aekWins - realWins)}</div>
            <div className="text-sm text-text-muted">Siegesdifferenz</div>
            <div className="text-xs text-text-muted mt-1">zwischen den Teams</div>
          </div>
          <div className="text-center p-4 bg-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-accent-blue">
              {totalMatches > 0 ? (((aekPlayers.length + realPlayers.length) * (totalMatches / 2)).toFixed(0)) : 0}
            </div>
            <div className="text-sm text-text-muted">Geschätzte Spielminuten</div>
            <div className="text-xs text-text-muted mt-1">pro Spieler (⌀ 45min)</div>
          </div>
        </div>
        
        {/* Performance Analysis */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary">🎯 Offensive Highlights</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Torreichstes Team:</span>
                <span className="font-medium">
                  {advancedStats.aekTotalGoals >= advancedStats.realTotalGoals ? 'AEK Athen' : 'Real Madrid'}
                  ({Math.max(advancedStats.aekTotalGoals, advancedStats.realTotalGoals)} Tore)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Höchste Einzelspiel-Toranzahl:</span>
                <span className="font-medium">{advancedStats.highestScoringMatch} Tore</span>
              </div>
              <div className="flex justify-between">
                <span>Aktivster Torschütze:</span>
                <span className="font-medium">
                  {playerStats.length > 0 ? `${playerStats[0].name} (${playerStats[0].goals} Tore)` : 'Keine Daten'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary">⚖️ Team-Balance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Kader-Unterschied:</span>
                <span className="font-medium">
                  {Math.abs(aekPlayers.length - realPlayers.length)} Spieler
                </span>
              </div>
              <div className="flex justify-between">
                <span>Marktwert-Verhältnis:</span>
                <span className="font-medium">
                  {aekPlayers.reduce((sum, p) => sum + (p.value || 0), 0) > realPlayers.reduce((sum, p) => sum + (p.value || 0), 0) ? 'AEK führt' : 'Real führt'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Dominanteres Team:</span>
                <span className="font-medium">
                  {aekWins > realWins ? 'AEK Athen' : realWins > aekWins ? 'Real Madrid' : 'Ausgeglichen'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Head-to-Head Statistics */}
      <div className="modern-card">
        <h3 className="font-bold text-lg mb-4">⚔️ Head-to-Head Bilanz</h3>
        <div className="mb-4 text-sm text-text-muted">
          Direkter Vergleich zwischen AEK Athen und Real Madrid über alle Spiele.
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{headToHead.aekWins}</div>
            <div className="text-sm text-blue-700">AEK Siege</div>
            <div className="text-xs text-text-muted mt-1">
              {headToHead.totalMatches > 0 ? `${((headToHead.aekWins / headToHead.totalMatches) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{headToHead.realWins}</div>
            <div className="text-sm text-red-700">Real Siege</div>
            <div className="text-xs text-text-muted mt-1">
              {headToHead.totalMatches > 0 ? `${((headToHead.realWins / headToHead.totalMatches) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {headToHead.totalMatches - headToHead.aekWins - headToHead.realWins}
            </div>
            <div className="text-sm text-gray-700">Unentschieden</div>
            <div className="text-xs text-text-muted mt-1">
              {headToHead.totalMatches > 0 ? `${(((headToHead.totalMatches - headToHead.aekWins - headToHead.realWins) / headToHead.totalMatches) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{headToHead.aekGoals + headToHead.realGoals}</div>
            <div className="text-sm text-green-700">Tore gesamt</div>
            <div className="text-xs text-text-muted mt-1">
              {headToHead.totalMatches > 0 ? `⌀ ${((headToHead.aekGoals + headToHead.realGoals) / headToHead.totalMatches).toFixed(1)} pro Spiel` : '⌀ 0 pro Spiel'}
            </div>
          </div>
        </div>

        {/* Biggest Wins Details */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🔵 Größter AEK Sieg</h4>
            {headToHead.biggestAekWin.diff > 0 ? (
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{headToHead.biggestAekWin.score}</div>
                <div className="text-sm text-blue-700">
                  Unterschied: {headToHead.biggestAekWin.diff} Tore
                </div>
                <div className="text-xs text-text-muted">
                  {new Date(headToHead.biggestAekWin.date).toLocaleDateString('de-DE')}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Noch kein Sieg verzeichnet</div>
            )}
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">🔴 Größter Real Sieg</h4>
            {headToHead.biggestRealWin.diff > 0 ? (
              <div>
                <div className="text-2xl font-bold text-red-600 mb-1">{headToHead.biggestRealWin.score}</div>
                <div className="text-sm text-red-700">
                  Unterschied: {headToHead.biggestRealWin.diff} Tore
                </div>
                <div className="text-xs text-text-muted">
                  {new Date(headToHead.biggestRealWin.date).toLocaleDateString('de-DE')}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Noch kein Sieg verzeichnet</div>
            )}
          </div>
        </div>
      </div>
      
      {/* New Advanced Analytics */}
      <div className="modern-card">
        <h3 className="font-bold text-lg mb-4">🔬 Detailanalyse</h3>
        <div className="mb-4 text-sm text-text-muted">
          Erweiterte Metriken für eine tiefgreifende Team-Analyse.
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-blue-600">💰 Wirtschaftliche Effizienz</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>⌀ Marktwert AEK:</span>
                <span className="font-medium">
                  {aekPlayers.length > 0 ? `${(aekPlayers.reduce((sum, p) => sum + (p.value || 0), 0) / aekPlayers.length).toFixed(1)}M €` : '0M €'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>⌀ Marktwert Real:</span>
                <span className="font-medium">
                  {realPlayers.length > 0 ? `${(realPlayers.reduce((sum, p) => sum + (p.value || 0), 0) / realPlayers.length).toFixed(1)}M €` : '0M €'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tore pro 1M € (AEK):</span>
                <span className="font-medium">
                  {aekPlayers.reduce((sum, p) => sum + (p.value || 0), 0) > 0 ? 
                    (advancedStats.aekTotalGoals / aekPlayers.reduce((sum, p) => sum + (p.value || 0), 0)).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tore pro 1M € (Real):</span>
                <span className="font-medium">
                  {realPlayers.reduce((sum, p) => sum + (p.value || 0), 0) > 0 ? 
                    (advancedStats.realTotalGoals / realPlayers.reduce((sum, p) => sum + (p.value || 0), 0)).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-red-600">🎲 Spielstatistiken</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Spiele gespielt:</span>
                <span className="font-medium">{totalMatches}</span>
              </div>
              <div className="flex justify-between">
                <span>Unentschieden:</span>
                <span className="font-medium">{totalMatches - aekWins - realWins}</span>
              </div>
              <div className="flex justify-between">
                <span>⌀ Spieldauer:</span>
                <span className="font-medium">~90 Minuten</span>
              </div>
              <div className="flex justify-between">
                <span>Längste Serie:</span>
                <span className="font-medium">
                  {aekWins >= realWins ? 'AEK' : 'Real'} ({Math.max(aekWins, realWins)} Siege)
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-purple-600">🏆 Erfolgs-Metriken</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Aktivste Spieler:</span>
                <span className="font-medium">{aekPlayers.length + realPlayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Top-Performer:</span>
                <span className="font-medium">
                  {playerStats.filter(p => p.sdsCount > 0).length} Spieler
                </span>
              </div>
              <div className="flex justify-between">
                <span>Konsistenz AEK:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? `${((aekWins / totalMatches) * 100).toFixed(0)}% Erfolg` : '0% Erfolg'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Konsistenz Real:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? `${((realWins / totalMatches) * 100).toFixed(0)}% Erfolg` : '0% Erfolg'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="modern-card">
      <h3 className="font-bold text-lg mb-4">📈 Performance-Trends</h3>
      <div className="space-y-4">
        {Object.values(performanceTrends).reverse().map((trend) => (
          <div key={trend.month} className="flex items-center justify-between py-3 border-b border-border-light last:border-b-0">
            <div className="font-medium">{trend.month}</div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">AEK: {trend.aekWins}</span>
                <span className="mx-2">vs</span>
                <span className="text-red-600 font-medium">Real: {trend.realWins}</span>
              </div>
              <div className="text-sm text-text-muted">
                {trend.matchCount} Spiele, {trend.totalGoals} Tore
              </div>
              <div className="text-sm font-medium">
                ⌀ {(trend.totalGoals / trend.matchCount).toFixed(1)} Tore/Spiel
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlkohol = () => {
    // Calculate alcohol statistics using persistent cumulative values and match calculation fallback
    const calculateAlcoholStats = () => {
      const stats = {
        totalShots: 0,
        aekShots: 0,
        realShots: 0,
        playerShots: {}
      };

      // Use persistent cumulative shots if available, otherwise calculate from matches
      if (calculatorValues.cumulativeShots && calculatorValues.cumulativeShots.total > 0) {
        // Use the persistent cumulative values
        stats.totalShots = calculatorValues.cumulativeShots.total;
        stats.aekShots = calculatorValues.cumulativeShots.aek;
        stats.realShots = calculatorValues.cumulativeShots.real;
      } else {
        // Fallback: Calculate from matches using the original logic
        // Sort matches by date to process chronologically
        const sortedMatches = matches?.slice().sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateA - dateB;
        }) || [];

        // Group matches by day and calculate cumulative shots per day
        const matchesByDay = {};
        sortedMatches.forEach(match => {
          const matchDate = new Date(match.date || 0);
          const dayKey = matchDate.toDateString();
          
          if (!matchesByDay[dayKey]) {
            matchesByDay[dayKey] = [];
          }
          matchesByDay[dayKey].push(match);
        });

        // Calculate shots per day with cumulative logic
        Object.keys(matchesByDay).forEach(dayKey => {
          const dayMatches = matchesByDay[dayKey];
          let cumulativeAekGoals = 0;
          let cumulativeRealGoals = 0;
          let aekShotsGiven = 0;
          let realShotsGiven = 0;

          dayMatches.forEach(match => {
            const aekGoals = match.goalsa || 0;
            const realGoals = match.goalsb || 0;
            
            cumulativeAekGoals += aekGoals;
            cumulativeRealGoals += realGoals;

            // Calculate shots based on cumulative goals from beginning of day
            // Every 2 goals scored means 1 shot (2cl) for the opposing team
            const newAekShots = Math.floor(cumulativeRealGoals / 2);
            const newRealShots = Math.floor(cumulativeAekGoals / 2);

            // Only add the difference (new shots since last match)
            const aekShotsToAdd = (newAekShots - aekShotsGiven) * 2; // 2cl per shot
            const realShotsToAdd = (newRealShots - realShotsGiven) * 2; // 2cl per shot

            stats.aekShots += aekShotsToAdd;
            stats.realShots += realShotsToAdd;
            stats.totalShots += aekShotsToAdd + realShotsToAdd;

            // Update counters
            aekShotsGiven = newAekShots;
            realShotsGiven = newRealShots;
          });
        });
      }

      // Use goals from players table (like in stats) instead of parsing match goalslists
      players?.forEach(player => {
        if (player.goals > 0) {
          if (!stats.playerShots[player.name]) {
            stats.playerShots[player.name] = { totalGoals: 0, alcoholCaused: 0 };
          }
          stats.playerShots[player.name].totalGoals = player.goals;
          // Calculate alcohol caused by each player (2cl per 2 goals)
          stats.playerShots[player.name].alcoholCaused = Math.floor(player.goals / 2) * 2;
        }
      });

      return stats;
    };

    const alcoholStats = calculateAlcoholStats();
    const topAlcoholCausers = Object.entries(alcoholStats.playerShots)
      .sort(([,a], [,b]) => b.alcoholCaused - a.alcoholCaused)
      .slice(0, 10);

    // Helper function to get recent matches (last two days)
    const getRecentMatches = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      return matches?.filter(match => {
        const matchDate = new Date(match.date);
        const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
        return matchDateOnly >= yesterday && matchDateOnly <= today;
      }) || [];
    };

    // Helper functions for automatic calculation of team-specific alcohol
    const getAutomaticAekDrinks = () => {
      if (calculatorValues.mode === 'automatic') {
        const recentMatches = getRecentMatches();
        const realGoals = recentMatches.reduce((total, match) => total + (match.goalsb || 0), 0);
        return Math.floor(realGoals / 2) * 2;
      }
      return Math.floor(calculatorValues.realGoals / 2) * 2;
    };

    const getAutomaticRealDrinks = () => {
      if (calculatorValues.mode === 'automatic') {
        const recentMatches = getRecentMatches();
        const aekGoals = recentMatches.reduce((total, match) => total + (match.goalsa || 0), 0);
        return Math.floor(aekGoals / 2) * 2;
      }
      return Math.floor(calculatorValues.aekGoals / 2) * 2;
    };

    const calculateMatchAlcohol = () => {
      if (calculatorValues.mode === 'automatic') {
        // Calculate from matches of last two days (current and previous day)
        const recentMatches = getRecentMatches();
        const totalGoals = recentMatches.reduce((total, match) => {
          return total + (match.goalsa || 0) + (match.goalsb || 0);
        }, 0);
        
        return Math.floor(totalGoals / 2) * 2;
      } else {
        // Manual calculation
        return Math.floor((calculatorValues.aekGoals + calculatorValues.realGoals) / 2) * 2;
      }
    };

    // Blood Alcohol Content calculation using Widmark formula with time decay
    const calculateBloodAlcohol = (alcoholCl, playerData, drinkingTime = null, beerCount = 0) => {
      if (!playerData.weight || (alcoholCl === 0 && beerCount === 0)) return '0.00';
      
      // Convert cl of 40% alcohol to grams of pure alcohol
      // 1cl = 10ml, 40% alcohol content, density of ethanol = 0.789g/ml
      let alcoholGrams = (alcoholCl * 10) * 0.4 * 0.789;
      
      // Add beer alcohol: 0.5L beer = 500ml * 0.05 (5%) = 25ml pure alcohol, density 0.789g/ml
      alcoholGrams += (beerCount * 0.5 * 1000 * 0.05 * 0.789); // Already in grams
      
      // Widmark factors (standard clinical values)
      const r = playerData.gender === 'female' ? 0.60 : 0.70;
      
      // Widmark formula: BAC = A / (r × m) where A=alcohol in grams, r=distribution factor, m=weight in kg
      // The result is in g/kg, which needs to be converted to ‰ (mg/g)
      // 1 g/kg = 1000 mg/kg = 1000 mg per 1000g = 1 mg/g = 1‰
      let bac = alcoholGrams / (playerData.weight * r);
      
      // Apply time decay using persisted drinking time or provided time
      const timeToUse = drinkingTime || calculatorValues.drinkingStartTime;
      if (timeToUse) {
        const now = new Date();
        const timePassed = (now - new Date(timeToUse)) / (1000 * 60 * 60); // hours
        
        // Alcohol elimination rate: approximately 0.15‰ per hour
        bac = Math.max(0, bac - (timePassed * 0.15));
      }
      
      // The result is already in promille (‰), so no additional conversion needed
      return bac.toFixed(2);
    };

    // Get BAK level warning and color coding
    const getBakLevelInfo = (bakValue) => {
      const bak = parseFloat(bakValue);
      if (bak === 0) return { status: 'Nüchtern', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      if (bak < 0.5) return { status: 'Gering beeinträchtigt', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      if (bak < 1.1) return { status: 'Fahruntüchtig', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      if (bak < 2.0) return { status: 'Stark beeinträchtigt', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      return { status: 'Lebensgefährlich', color: 'text-red-800', bg: 'bg-red-100', border: 'border-red-400' };
    };

    return (
      <div className="space-y-6">
        {/* Overview Statistics with Unit Conversions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card text-center">
            <div className="text-3xl mb-2">🍺</div>
            <div className="text-2xl font-bold text-primary-green">{alcoholStats.totalShots}cl</div>
            <div className="text-sm text-text-muted">Gesamt Schnaps</div>
            <div className="text-xs text-text-muted mt-1 space-y-1">
              <div>≈ {alcoholUtils.clToLiters(alcoholStats.totalShots)}L</div>
              <div>≈ {alcoholUtils.clToShots(alcoholStats.totalShots)} Shots</div>
              <div>≈ {alcoholUtils.clToGlasses(alcoholStats.totalShots)} Gläser</div>
            </div>
          </div>
          <div className="modern-card text-center">
            <div className="text-3xl mb-2">🔵</div>
            <div className="text-2xl font-bold text-blue-600">{alcoholStats.aekShots}cl</div>
            <div className="text-sm text-text-muted">AEK getrunken</div>
            <div className="text-xs text-text-muted mt-1 space-y-1">
              <div>≈ {alcoholUtils.clToLiters(alcoholStats.aekShots)}L</div>
              <div>≈ {alcoholUtils.clToShots(alcoholStats.aekShots)} Shots</div>
              <div>{alcoholStats.totalShots > 0 ? ((alcoholStats.aekShots / alcoholStats.totalShots) * 100).toFixed(1) : 0}% vom Gesamt</div>
            </div>
          </div>
          <div className="modern-card text-center">
            <div className="text-3xl mb-2">🔴</div>
            <div className="text-2xl font-bold text-red-600">{alcoholStats.realShots}cl</div>
            <div className="text-sm text-text-muted">Real getrunken</div>
            <div className="text-xs text-text-muted mt-1 space-y-1">
              <div>≈ {alcoholUtils.clToLiters(alcoholStats.realShots)}L</div>
              <div>≈ {alcoholUtils.clToShots(alcoholStats.realShots)} Shots</div>
              <div>{alcoholStats.totalShots > 0 ? ((alcoholStats.realShots / alcoholStats.totalShots) * 100).toFixed(1) : 0}% vom Gesamt</div>
            </div>
          </div>
        </div>

        {/* Top Alcohol Causers */}
        <div className="modern-card">
          <h3 className="font-bold text-lg mb-4">🍻 Top Alkohol-Verursacher</h3>
          <div className="text-sm text-text-muted mb-4">
            Spieler, die mit ihren Toren am meisten Alkohol für den Gegner verursacht haben
          </div>
          <div className="space-y-3">
            {topAlcoholCausers.map(([player, data], index) => (
              <div key={player} className="flex items-center justify-between py-2 border-b border-border-light last:border-b-0">
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium">{player}</div>
                    <div className="text-sm text-text-muted space-x-2">
                      <span>{data.totalGoals} Tore</span>
                      <span>≈ {alcoholUtils.clToLiters(data.alcoholCaused)}L</span>
                      <span>≈ {alcoholUtils.clToShots(data.alcoholCaused)} Shots</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-green">{data.alcoholCaused}cl</div>
                  <div className="text-sm text-text-muted">verursacht</div>
                </div>
              </div>
            ))}
            {topAlcoholCausers.length === 0 && (
              <div className="text-center text-text-muted py-4">
                Noch keine Tore geschossen - noch kein Alkohol verursacht!
              </div>
            )}
          </div>
        </div>

        {/* Match Overview with Alcohol Consumption */}
        <div className="modern-card">
          <h3 className="font-bold text-lg mb-4">📋 Spiele & Alkohol-Übersicht</h3>
          <div className="text-sm text-text-muted mb-4">
            Übersicht über alle Spiele und den dabei konsumierten Alkohol
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matches?.slice().reverse().map((match, index) => {
              const aekGoals = match.goalsa || 0;
              const realGoals = match.goalsb || 0;
              const totalAlcohol = Math.floor((aekGoals + realGoals) / 2) * 2;
              const aekDrinks = Math.floor(realGoals / 2) * 2;
              const realDrinks = Math.floor(aekGoals / 2) * 2;
              
              return (
                <div key={match.id || index} className="p-3 bg-bg-secondary rounded-lg border border-border-light">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-lg">
                        {aekGoals}:{realGoals} 
                        <span className="text-sm text-text-muted ml-2">
                          ({match.date || 'Kein Datum'})
                        </span>
                      </div>
                      <div className="text-sm text-text-muted">
                        AEK vs Real Madrid
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-green">{totalAlcohol}cl</div>
                      <div className="text-xs text-text-muted">
                        {alcoholUtils.clToLiters(totalAlcohol)}L | {alcoholUtils.clToShots(totalAlcohol)} Shots
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-sm font-bold text-blue-600">{aekDrinks}cl</div>
                      <div className="text-xs text-blue-700">AEK trinkt</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-sm font-bold text-red-600">{realDrinks}cl</div>
                      <div className="text-xs text-red-700">Real trinkt</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!matches || matches.length === 0) && (
              <div className="text-center text-text-muted py-4">
                Noch keine Spiele vorhanden
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Alcohol Calculator */}
        <div className="modern-card">
          <h3 className="font-bold text-lg mb-4">🧮 Erweiterte Alkohol-Rechner</h3>
          <div className="text-sm text-text-muted mb-6">
            Berechne Alkoholkonsum für Spiele und Spieltage inklusive Bier-Konsum und Blutalkohol
          </div>

          {/* Cumulative Shots Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3">📊 Automatische Schnaps-Verfolgung</h4>
            <div className="text-sm text-blue-700 mb-3">
              Shots werden automatisch bei jedem neuen Spiel hinzugefügt und permanent gespeichert.
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-white rounded border border-blue-200">
                <div className="text-lg font-bold text-blue-600">{calculatorValues.cumulativeShots.total}cl</div>
                <div className="text-xs text-blue-700">Gesamt Schnaps</div>
              </div>
              <div className="text-center p-2 bg-white rounded border border-blue-200">
                <div className="text-lg font-bold text-blue-600">{calculatorValues.cumulativeShots.aek}cl</div>
                <div className="text-xs text-blue-700">AEK getrunken</div>
              </div>
              <div className="text-center p-2 bg-white rounded border border-blue-200">
                <div className="text-lg font-bold text-red-600">{calculatorValues.cumulativeShots.real}cl</div>
                <div className="text-xs text-red-700">Real getrunken</div>
              </div>
              <div className="text-center p-2 bg-white rounded border border-blue-200">
                <div className="text-xs font-bold text-gray-600">
                  {calculatorValues.cumulativeShots.lastUpdated ? 
                    new Date(calculatorValues.cumulativeShots.lastUpdated).toLocaleDateString('de-DE') : 
                    'Noch nicht aktualisiert'
                  }
                </div>
                <div className="text-xs text-gray-600">Letzte Aktualisierung</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-600">
              💡 Diese Werte werden automatisch aktualisiert, wenn neue Spiele hinzugefügt werden. 
              Letztes verarbeitetes Spiel: Match ID {calculatorValues.cumulativeShots.lastMatchId || 'Keins'}
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => {
                  const updated = updateCumulativeShotsFromMatches(matches, calculatorValues);
                  setCalculatorValues(updated);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                🔄 Shots neu berechnen
              </button>
            </div>
          </div>
          
          {/* Basic Game Calculator */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">⚽ Spiel-Rechner</h4>
            
            {/* Mode Toggle */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium mb-2">Berechnungsmodus</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="calculatorMode"
                    value="manual"
                    checked={calculatorValues.mode === 'manual'}
                    onChange={(e) => updateCalculatorValuesWithPersistence({
                      mode: e.target.value
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Manuell</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="calculatorMode"
                    value="automatic"
                    checked={calculatorValues.mode === 'automatic'}
                    onChange={(e) => updateCalculatorValuesWithPersistence({
                      mode: e.target.value
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Automatisch (letzten 2 Spieltage)</span>
                </label>
              </div>
              <div className="text-xs text-text-muted mt-1">
                {calculatorValues.mode === 'manual' 
                  ? 'Geben Sie Tore manuell ein' 
                  : 'Berechnet automatisch aus Spielen der letzten zwei Tage (heute + gestern)'}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 alcohol-calculator-grid">
              <div className="space-y-4">
                {calculatorValues.mode === 'manual' && (
                <div className="space-y-4">
                <div className="alcohol-input-group">
                  <label className="block text-sm font-medium mb-2">AEK Tore</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={calculatorValues.aekGoals}
                    onChange={(e) => updateCalculatorValuesWithPersistence({
                      aekGoals: parseInt(e.target.value) || 0
                    })}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                  />
                </div>
                <div className="alcohol-input-group">
                  <label className="block text-sm font-medium mb-2">Real Tore</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={calculatorValues.realGoals}
                    onChange={(e) => updateCalculatorValuesWithPersistence({
                      realGoals: parseInt(e.target.value) || 0
                    })}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                  />
                </div>
                </div>
                )}
                
                {calculatorValues.mode === 'automatic' && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">📊 Automatische Berechnung</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                      {(() => {
                        const recentMatches = getRecentMatches();
                        const totalGoals = recentMatches.reduce((total, match) => {
                          return total + (match.goalsa || 0) + (match.goalsb || 0);
                        }, 0);
                        
                        return (
                          <>
                            <div>Spiele (letzte 2 Tage): {recentMatches.length}</div>
                            <div>Gesamt-Tore: {totalGoals}</div>
                            <div>Daraus resultierend: {calculateMatchAlcohol()}cl Schnaps</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-bg-secondary rounded-lg alcohol-display-card">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🥃</div>
                    <div className="text-2xl font-bold text-primary-green">{calculateMatchAlcohol()}cl</div>
                    <div className="text-sm text-text-muted">Gesamt Schnaps</div>
                    <div className="text-xs text-text-muted mt-1 space-y-1">
                      <div>≈ {alcoholUtils.clToLiters(calculateMatchAlcohol())}L</div>
                      <div>≈ {alcoholUtils.clToShots(calculateMatchAlcohol())} Shots</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {getAutomaticAekDrinks()}cl
                    </div>
                    <div className="text-sm text-blue-700">AEK trinkt</div>
                    <div className="text-xs text-blue-700">
                      {alcoholUtils.clToShots(getAutomaticAekDrinks())} Shots
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {getAutomaticRealDrinks()}cl
                    </div>
                    <div className="text-sm text-red-700">Real trinkt</div>
                    <div className="text-xs text-red-700">
                      {alcoholUtils.clToShots(getAutomaticRealDrinks())} Shots
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Day Calculator */}
          <div className="mb-6 border-t pt-6">
            <h4 className="font-semibold mb-3">📅 Spieltag-Rechner</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Spieltag (Datum)</label>
                  <input
                    type="date"
                    value={calculatorValues.gameDay}
                    onChange={(e) => updateCalculatorValuesWithPersistence({
                      gameDay: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bier-Anzahl (0,5L je)</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs text-blue-600 mb-1">🔵 AEK Bier</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={calculatorValues.beerCount.aek}
                          onChange={(e) => updateCalculatorValuesWithPersistence({
                            beerCount: {
                              aek: parseInt(e.target.value) || 0
                            }
                          })}
                          onFocus={(e) => e.target.select()}
                          className="flex-1 px-2 py-1 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                          style={{ fontSize: '16px' }} // Prevent iPhone zoom
                        />
                        <button
                          onClick={() => updateCalculatorValuesWithPersistence({
                            beerCount: {
                              aek: calculatorValues.beerCount.aek + 1
                            }
                          })}
                          className="beer-counter-button px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          title="0,5L Bier (5% Alkohol) für AEK hinzufügen"
                        >
                          🍺 +0,5L
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-red-600 mb-1">🔴 Real Bier</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={calculatorValues.beerCount.real}
                          onChange={(e) => updateCalculatorValuesWithPersistence({
                            beerCount: {
                              real: parseInt(e.target.value) || 0
                            }
                          })}
                          onFocus={(e) => e.target.select()}
                          className="flex-1 px-2 py-1 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                          style={{ fontSize: '16px' }} // Prevent iPhone zoom
                        />
                        <button
                          onClick={() => updateCalculatorValuesWithPersistence({
                            beerCount: {
                              real: calculatorValues.beerCount.real + 1
                            }
                          })}
                          className="beer-counter-button px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          title="0,5L Bier (5% Alkohol) für Real hinzufügen"
                        >
                          🍺 +0,5L
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mb-2">
                    <button
                      onClick={() => updateCalculatorValuesWithPersistence({
                        beerCount: {
                          aek: calculatorValues.beerCount.aek + 1,
                          real: calculatorValues.beerCount.real + 1
                        }
                      })}
                      className="beer-counter-button px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                      title="0,5L Bier (5% Alkohol) für beide Teams hinzufügen"
                    >
                      🍺🍺 Beide +0,5L
                    </button>
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    AEK: {(calculatorValues.beerCount.aek * 0.5).toFixed(1)}L | Real: {(calculatorValues.beerCount.real * 0.5).toFixed(1)}L Bier (5% Alkohol)
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-bg-secondary rounded-lg">
                  <h5 className="font-medium mb-2">Spieltag-Alkohol</h5>
                  <div className="text-sm space-y-1">
                    <div>Schnaps: {calculateMatchAlcohol()}cl (40% Alkohol)</div>
                    <div>AEK Bier: {(calculatorValues.beerCount.aek * 0.5 * 5).toFixed(1)}cl reiner Alkohol</div>
                    <div>Real Bier: {(calculatorValues.beerCount.real * 0.5 * 5).toFixed(1)}cl reiner Alkohol</div>
                    <div className="border-t pt-1 font-semibold">
                      Gesamt: {(calculateMatchAlcohol() * 0.4 + (calculatorValues.beerCount.aek + calculatorValues.beerCount.real) * 0.5 * 0.05).toFixed(1)}cl reiner Alkohol
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Data & Blood Alcohol Calculator */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">👥 Spieler-Daten & Blutalkohol</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-blue-600 mb-2">🔵 Chef AEK</h5>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={calculatorValues.playerData.aekChef.name}
                      onChange={(e) => setCalculatorValues(prev => ({
                        ...prev,
                        playerData: {
                          ...prev.playerData,
                          aekChef: { ...prev.playerData.aekChef, name: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                      style={{ fontSize: '16px' }} // Prevent iPhone zoom
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Gewicht (kg)"
                        min="40"
                        max="150"
                        value={calculatorValues.playerData.aekChef.weight}
                        onChange={(e) => setCalculatorValues(prev => ({
                          ...prev,
                          playerData: {
                            ...prev.playerData,
                            aekChef: { ...prev.playerData.aekChef, weight: parseInt(e.target.value) || 70 }
                          }
                        }))}
                        onFocus={(e) => e.target.select()}
                        className="px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                        style={{ fontSize: '16px' }} // Prevent iPhone zoom
                      />
                      <select
                        value={calculatorValues.playerData.aekChef.gender}
                        onChange={(e) => setCalculatorValues(prev => ({
                          ...prev,
                          playerData: {
                            ...prev.playerData,
                            aekChef: { ...prev.playerData.aekChef, gender: e.target.value }
                          }
                        }))}
                        className="px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                      >
                        <option value="male">Männlich</option>
                        <option value="female">Weiblich</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-red-600 mb-2">🔴 Chef Real</h5>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={calculatorValues.playerData.realChef.name}
                      onChange={(e) => setCalculatorValues(prev => ({
                        ...prev,
                        playerData: {
                          ...prev.playerData,
                          realChef: { ...prev.playerData.realChef, name: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                      style={{ fontSize: '16px' }} // Prevent iPhone zoom
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Gewicht (kg)"
                        min="40"
                        max="150"
                        value={calculatorValues.playerData.realChef.weight}
                        onChange={(e) => setCalculatorValues(prev => ({
                          ...prev,
                          playerData: {
                            ...prev.playerData,
                            realChef: { ...prev.playerData.realChef, weight: parseInt(e.target.value) || 70 }
                          }
                        }))}
                        onFocus={(e) => e.target.select()}
                        className="px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                        style={{ fontSize: '16px' }} // Prevent iPhone zoom
                      />
                      <select
                        value={calculatorValues.playerData.realChef.gender}
                        onChange={(e) => setCalculatorValues(prev => ({
                          ...prev,
                          playerData: {
                            ...prev.playerData,
                            realChef: { ...prev.playerData.realChef, gender: e.target.value }
                          }
                        }))}
                        className="px-3 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green"
                      >
                        <option value="male">Männlich</option>
                        <option value="female">Weiblich</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-bg-secondary rounded-lg">
                  <h5 className="font-medium mb-3">🧪 Blutalkohol-Rechnung</h5>
                  <div className="space-y-3">
                    <div className="p-3 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-600">
                        {calculatorValues.playerData.aekChef.name || 'Chef AEK'} trinkt: {getAutomaticAekDrinks()}cl
                      </div>
                      {(() => {
                        const bakValue = calculatorValues.mode === 'automatic' 
                          ? (() => {
                              const recentMatches = getRecentMatches();
                              const latestMatch = recentMatches.length > 0 ? recentMatches[recentMatches.length - 1] : null;
                              return calculateBloodAlcohol(getAutomaticAekDrinks(), calculatorValues.playerData.aekChef, latestMatch?.date, calculatorValues.beerCount.aek);
                            })()
                          : calculateBloodAlcohol(Math.floor(calculatorValues.realGoals / 2) * 2, calculatorValues.playerData.aekChef, null, calculatorValues.beerCount.aek);
                        const levelInfo = getBakLevelInfo(bakValue);
                        return (
                          <div className={`text-sm mt-2 p-2 rounded ${levelInfo.bg} ${levelInfo.border} border`}>
                            <div className={`font-bold ${levelInfo.color}`}>
                              BAK: {bakValue}‰
                            </div>
                            <div className={`text-xs ${levelInfo.color}`}>
                              {levelInfo.status}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="p-3 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-600">
                        {calculatorValues.playerData.realChef.name || 'Chef Real'} trinkt: {getAutomaticRealDrinks()}cl
                      </div>
                      {(() => {
                        const bakValue = calculatorValues.mode === 'automatic' 
                          ? (() => {
                              const recentMatches = getRecentMatches();
                              const latestMatch = recentMatches.length > 0 ? recentMatches[recentMatches.length - 1] : null;
                              return calculateBloodAlcohol(getAutomaticRealDrinks(), calculatorValues.playerData.realChef, latestMatch?.date, calculatorValues.beerCount.real);
                            })()
                          : calculateBloodAlcohol(Math.floor(calculatorValues.aekGoals / 2) * 2, calculatorValues.playerData.realChef, null, calculatorValues.beerCount.real);
                        const levelInfo = getBakLevelInfo(bakValue);
                        return (
                          <div className={`text-sm mt-2 p-2 rounded ${levelInfo.bg} ${levelInfo.border} border`}>
                            <div className={`font-bold ${levelInfo.color}`}>
                              BAK: {bakValue}‰
                            </div>
                            <div className={`text-xs ${levelInfo.color}`}>
                              {levelInfo.status}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-xs text-text-muted mt-3">
                    <strong>Hinweis:</strong> BAK-Berechnung ist eine Näherung (Widmark-Formel) mit Alkoholabbau (~0.15‰/h). 
                    Exakte Werte können abweichen. Automatischer Modus berücksichtigt Zeit seit letztem Spiel.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              <strong>Regeln:</strong> Für jedes zweite Tor muss der Gegner 2cl Schnaps (40%) trinken. 
              0,5L Bier (5% Alkohol) entspricht 2,5cl reinem Alkohol.
            </div>
          </div>

          {/* Drinking Time Tracking */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-lg text-blue-800">⏱️ Zeit-Tracking für BAK-Abbau</h4>
              {calculatorValues.drinkingStartTime && (
                <div className="text-sm text-blue-700">
                  Gestartet: {new Date(calculatorValues.drinkingStartTime).toLocaleString('de-DE')}
                </div>
              )}
            </div>
            <div className="text-sm text-blue-700 mb-4">
              Aktivieren Sie das Zeit-Tracking, um den Alkoholabbau über die Zeit korrekt zu berechnen. 
              {calculatorValues.drinkingStartTime ? 
                ` Seit Start: ${getHoursSinceDrinkingStarted(calculatorValues).toFixed(1)} Stunden.` :
                ' Dies startet die Uhr für die BAK-Abbau-Berechnung.'
              }
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const updated = setDrinkingStartTime(calculatorValues);
                  setCalculatorValues(updated);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🍺 Trinken starten/neu starten
              </button>
              {calculatorValues.drinkingStartTime && (
                <button
                  onClick={() => updateCalculatorValuesWithPersistence({
                    drinkingStartTime: null
                  })}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ⏹️ Zeit-Tracking stoppen
                </button>
              )}
            </div>
          </div>

          {/* BAK Reference Table */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-bold text-lg mb-3 text-gray-800">📊 BAK-Referenztabelle</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
              <div className="p-2 bg-green-100 border border-green-200 rounded text-center">
                <div className="font-semibold text-green-800">0.0‰</div>
                <div className="text-xs text-green-700">Nüchtern</div>
              </div>
              <div className="p-2 bg-yellow-100 border border-yellow-200 rounded text-center">
                <div className="font-semibold text-yellow-800">0.3-0.5‰</div>
                <div className="text-xs text-yellow-700">Leicht beeinträchtigt</div>
              </div>
              <div className="p-2 bg-orange-100 border border-orange-200 rounded text-center">
                <div className="font-semibold text-orange-800">0.5-1.1‰</div>
                <div className="text-xs text-orange-700">Fahruntüchtig</div>
              </div>
              <div className="p-2 bg-red-100 border border-red-200 rounded text-center">
                <div className="font-semibold text-red-800">1.1-2.0‰</div>
                <div className="text-xs text-red-700">Stark beeinträchtigt</div>
              </div>
              <div className="p-2 bg-red-200 border border-red-400 rounded text-center">
                <div className="font-semibold text-red-900">2.0+‰</div>
                <div className="text-xs text-red-800">Lebensgefährlich</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <strong>Wichtig:</strong> Dies ist nur eine grobe Orientierung. Individuelle Faktoren können stark abweichen. 
              Bei hohen Werten bitte medizinische Hilfe suchen!
            </div>
          </div>
        </div>

        {/* Enhanced Team Alcohol Statistics */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="modern-card border-l-4 border-blue-400">
            <h3 className="font-bold text-lg mb-4 text-blue-600">🔵 AEK Alkohol-Bilanz</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Getrunken (durch Real Tore):</span>
                <div className="text-right">
                  <div className="font-semibold text-red-600">{alcoholStats.aekShots}cl</div>
                  <div className="text-xs text-text-muted">
                    {alcoholUtils.clToLiters(alcoholStats.aekShots)}L | {alcoholUtils.clToShots(alcoholStats.aekShots)} Shots
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Verursacht (durch AEK Tore):</span>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{alcoholStats.realShots}cl</div>
                  <div className="text-xs text-text-muted">
                    {alcoholUtils.clToLiters(alcoholStats.realShots)}L | {alcoholUtils.clToShots(alcoholStats.realShots)} Shots
                  </div>
                </div>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Alkohol-Bilanz:</span>
                <div className="text-right">
                  <div className={`font-bold ${alcoholStats.realShots > alcoholStats.aekShots ? 'text-green-600' : 'text-red-600'}`}>
                    {alcoholStats.realShots > alcoholStats.aekShots ? '+' : ''}{alcoholStats.realShots - alcoholStats.aekShots}cl
                  </div>
                  <div className="text-xs text-text-muted">
                    {alcoholUtils.clToShots(Math.abs(alcoholStats.realShots - alcoholStats.aekShots))} Shots Differenz
                  </div>
                </div>
              </div>
              <div className="text-xs text-text-muted">
                {alcoholStats.realShots > alcoholStats.aekShots ? 'AEK verursacht mehr als getrunken' : 'AEK trinkt mehr als verursacht'}
              </div>
            </div>
          </div>
          <div className="modern-card border-l-4 border-red-400">
            <h3 className="font-bold text-lg mb-4 text-red-600">🔴 Real Alkohol-Bilanz</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Getrunken (durch AEK Tore):</span>
                <div className="text-right">
                  <div className="font-semibold text-red-600">{alcoholStats.realShots}cl</div>
                  <div className="text-xs text-text-muted">
                    {alcoholUtils.clToLiters(alcoholStats.realShots)}L | {alcoholUtils.clToShots(alcoholStats.realShots)} Shots
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Verursacht (durch Real Tore):</span>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{alcoholStats.aekShots}cl</div>
                  <div className="text-xs text-text-muted">
                    {alcoholUtils.clToLiters(alcoholStats.aekShots)}L | {alcoholUtils.clToShots(alcoholStats.aekShots)} Shots
                  </div>
                </div>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Alkohol-Bilanz:</span>
                <div className="text-right">
                  <div className={`font-bold ${alcoholStats.aekShots > alcoholStats.realShots ? 'text-green-600' : 'text-red-600'}`}>
                    {alcoholStats.aekShots > alcoholStats.realShots ? '+' : ''}{alcoholStats.aekShots - alcoholStats.realShots}cl
                  </div>
                  <div className="text-xs text-text-muted">
                    {alcoholUtils.clToShots(Math.abs(alcoholStats.aekShots - alcoholStats.realShots))} Shots Differenz
                  </div>
                </div>
              </div>
              <div className="text-xs text-text-muted">
                {alcoholStats.aekShots > alcoholStats.realShots ? 'Real verursacht mehr als getrunken' : 'Real trinkt mehr als verursacht'}
              </div>
            </div>
          </div>
        </div>

        {/* New Enhanced Statistics Section */}
        <div className="modern-card">
          <h3 className="font-bold text-lg mb-4">📈 Zusätzliche Alkohol-Statistiken</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {(() => {
                  return totalMatches > 0 ? (alcoholStats.totalShots / totalMatches).toFixed(1) : '0.0';
                })()}cl
              </div>
              <div className="text-sm text-purple-700">⌀ Alkohol pro Spiel</div>
              <div className="text-xs text-purple-600 mt-1">
                Durchschnittlicher Schnaps-Konsum
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {(() => {
                  const maxAlcoholMatch = matches?.reduce((max, match) => {
                    const goals = (match.goalsa || 0) + (match.goalsb || 0);
                    const alcohol = Math.floor(goals / 2) * 2;
                    return alcohol > max ? alcohol : max;
                  }, 0) || 0;
                  return maxAlcoholMatch;
                })()}cl
              </div>
              <div className="text-sm text-orange-700">🔥 Höchster Alkohol-Verbrauch</div>
              <div className="text-xs text-orange-600 mt-1">
                In einem einzelnen Spiel
              </div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  const alcoholFreeMatches = matches?.filter(match => {
                    const goals = (match.goalsa || 0) + (match.goalsb || 0);
                    return Math.floor(goals / 2) * 2 === 0;
                  }).length || 0;
                  const lowAlcoholMatches = matches?.filter(match => {
                    const goals = (match.goalsa || 0) + (match.goalsb || 0);
                    const alcohol = Math.floor(goals / 2) * 2;
                    return alcohol > 0 && alcohol <= 4;
                  }).length || 0;
                  return `${alcoholFreeMatches}/${lowAlcoholMatches}`;
                })()}
              </div>
              <div className="text-sm text-green-700">🚫 Nüchterne/Wenig-Alkohol Spiele</div>
              <div className="text-xs text-green-600 mt-1">
                Alkoholfrei / Wenig Alkohol (≤4cl)
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-amber-600">
                {(() => {
                  const heavyAlcoholMatches = matches?.filter(match => {
                    const goals = (match.goalsa || 0) + (match.goalsb || 0);
                    const alcohol = Math.floor(goals / 2) * 2;
                    return alcohol >= 10;
                  }).length || 0;
                  const totalMatches = matches?.length || 0;
                  const percentage = totalMatches > 0 ? ((heavyAlcoholMatches / totalMatches) * 100).toFixed(0) : 0;
                  return `${heavyAlcoholMatches} (${percentage}%)`;
                })()}
              </div>
              <div className="text-sm text-amber-700">🍻 Starke Alkohol-Spiele</div>
              <div className="text-xs text-amber-600 mt-1">
                Spiele mit ≥10cl Alkohol
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (selectedView) {
      case 'dashboard': return <EnhancedDashboard onNavigate={onNavigate} />;
      case 'players': return renderPlayers();
      case 'teams': return renderTeams();
      case 'trends': return renderTrends();
      case 'alkohol': return renderAlkohol();
      case 'advanced': return <AdvancedAnalytics />;
      case 'playeranalytics': return <PlayerPerformanceAnalytics />;
      case 'matchprediction': return <MatchPredictionEngine />;
      case 'financialanalytics': return <EnhancedFinancialAnalytics />;
      default: return renderOverview();
    }
  };

  return (
    <div className="p-4 pb-24 mobile-safe-bottom">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">📊 Statistiken</h2>
        <p className="text-text-muted">Umfassende Analyse von Spielen, Spielern und Teams</p>
      </div>

      {/* View Navigation with Scroll Indicators */}
      <div className="relative mb-6">
        <div className="icon-only-nav flex overflow-x-auto space-x-2 pb-2 scroll-indicator-container">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id)}
              className={`stats-nav-button flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedView === view.id
                  ? 'bg-primary-green text-white'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
              }`}
              title={view.label}
              aria-label={view.label}
            >
              <span>{view.icon}</span>
              <span className="font-medium hidden sm:inline">{view.label}</span>
            </button>
          ))}
        </div>
        {/* Scroll Indicators */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-gradient-to-r from-bg-primary to-transparent pointer-events-none opacity-50 md:hidden"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-gradient-to-l from-bg-primary to-transparent pointer-events-none opacity-50 md:hidden"></div>
      </div>

      {/* Content */}
      <div className="form-container">
        {renderCurrentView()}
      </div>
    </div>
  );
}