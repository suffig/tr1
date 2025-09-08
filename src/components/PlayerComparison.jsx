import { useState, useMemo, useCallback } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import LoadingSpinner from './LoadingSpinner';

/**
 * PlayerComparison.jsx - Detaillierte Vergleiche von bis zu 4 Spielern
 * Features:
 * - Performance-Ratings, Effizienz-Metriken und visuelle Statistik-Balken
 * - Sortierbare Tabellen mit erweiterten Filteroptionen
 * - Interactive comparison with advanced analytics
 */
export default function PlayerComparison({ onNavigate }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [comparisonMetric, setComparisonMetric] = useState('overall');
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterTeam, setFilterTeam] = useState('all');

  // Fetch data
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  const { data: matches, loading: matchesLoading } = useSupabaseQuery('matches', '*');
  const { data: bans, loading: bansLoading } = useSupabaseQuery('bans', '*');

  const loading = playersLoading || matchesLoading || bansLoading;

  // Calculate comprehensive player statistics
  const playerStats = useMemo(() => {
    if (!players || !matches || !bans) return [];

    return players.map(player => {
      // Get player matches
      const playerMatches = matches.filter(match => 
        match.aek_players?.includes(player.id) || match.real_players?.includes(player.id)
      );

      // Get player bans
      const playerBans = bans.filter(ban => ban.player_id === player.id);
      
      // Calculate basic stats
      const totalMatches = playerMatches.length;
      const wins = playerMatches.filter(match => {
        const isAEK = match.aek_players?.includes(player.id);
        const aekScore = match.aek_score || 0;
        const realScore = match.real_score || 0;
        return isAEK ? aekScore > realScore : realScore > aekScore;
      }).length;
      
      const draws = playerMatches.filter(match => {
        const aekScore = match.aek_score || 0;
        const realScore = match.real_score || 0;
        return aekScore === realScore;
      }).length;
      
      const losses = totalMatches - wins - draws;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
      
      // Advanced metrics
      const totalBans = playerBans.length;
      const totalBanGames = playerBans.reduce((sum, ban) => sum + (ban.totalgames || 0), 0);
      const bansPerMatch = totalMatches > 0 ? totalBans / totalMatches : 0;
      
      // Performance rating calculation
      const performanceRating = calculatePerformanceRating({
        winRate,
        totalMatches,
        bansPerMatch,
        totalBans,
        recentForm: calculateRecentForm(playerMatches.slice(-5))
      });

      // Efficiency metrics
      const efficiency = {
        winEfficiency: winRate,
        disciplineEfficiency: Math.max(0, 100 - (bansPerMatch * 50)),
        consistencyEfficiency: calculateConsistency(playerMatches),
        overallEfficiency: (winRate + Math.max(0, 100 - (bansPerMatch * 50)) + calculateConsistency(playerMatches)) / 3
      };

      return {
        ...player,
        stats: {
          totalMatches,
          wins,
          draws,
          losses,
          winRate,
          totalBans,
          totalBanGames,
          bansPerMatch,
          performanceRating,
          efficiency,
          recentForm: calculateRecentForm(playerMatches.slice(-5)),
          averageGoalDifference: calculateAverageGoalDifference(playerMatches, player.id),
          strongestOpponent: findStrongestOpponent(playerMatches, player.id, players),
          lastMatchDate: playerMatches.length > 0 ? new Date(Math.max(...playerMatches.map(m => new Date(m.date)))) : null
        }
      };
    });
  }, [players, matches, bans]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = playerStats;

    if (filterTeam !== 'all') {
      filtered = filtered.filter(player => player.team === filterTeam);
    }

    // Sort players
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'rating':
          aValue = a.stats.performanceRating;
          bValue = b.stats.performanceRating;
          break;
        case 'winRate':
          aValue = a.stats.winRate;
          bValue = b.stats.winRate;
          break;
        case 'matches':
          aValue = a.stats.totalMatches;
          bValue = b.stats.totalMatches;
          break;
        case 'efficiency':
          aValue = a.stats.efficiency.overallEfficiency;
          bValue = b.stats.efficiency.overallEfficiency;
          break;
        case 'discipline':
          aValue = a.stats.efficiency.disciplineEfficiency;
          bValue = b.stats.efficiency.disciplineEfficiency;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [playerStats, filterTeam, sortBy, sortOrder]);

  // Add/remove player from comparison
  const togglePlayerSelection = useCallback((player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.find(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else if (prev.length < 4) {
        return [...prev, player];
      } else {
        // Replace the first player if at maximum
        return [player, ...prev.slice(1)];
      }
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedPlayers([]);
  }, []);

  if (loading) {
    return <LoadingSpinner message="Lade Spielerdaten für Vergleich..." />;
  }

  return (
    <div className="player-comparison space-y-6">
      {/* Header and Controls */}
      <div className="modern-card">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2 flex items-center gap-2">
              ⚖️ Spieler-Vergleich
            </h2>
            <p className="text-text-secondary text-sm">
              Vergleiche bis zu 4 Spieler in detaillierten Performance-Metriken
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Team Filter */}
            <select 
              value={filterTeam} 
              onChange={(e) => setFilterTeam(e.target.value)}
              className="modern-select"
            >
              <option value="all">Alle Teams</option>
              <option value="AEK">AEK</option>
              <option value="Real">Real</option>
            </select>

            {/* Sort Options */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="modern-select"
            >
              <option value="rating">Performance Rating</option>
              <option value="winRate">Siegquote</option>
              <option value="matches">Spiele</option>
              <option value="efficiency">Effizienz</option>
              <option value="discipline">Disziplin</option>
              <option value="name">Name</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="modern-button-secondary"
              title={`Sortierung: ${sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            {selectedPlayers.length > 0 && (
              <button
                onClick={clearSelection}
                className="modern-button-danger"
              >
                Auswahl löschen ({selectedPlayers.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Players Comparison */}
      {selectedPlayers.length > 0 && (
        <div className="modern-card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Vergleich ({selectedPlayers.length}/4 Spieler)
          </h3>
          
          <div className="comparison-grid grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {selectedPlayers.map((player, index) => (
              <div key={player.id} className="comparison-card bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getTeamColor(player.team)}`}></div>
                    <h4 className="font-medium text-text-primary">{player.name}</h4>
                  </div>
                  <button
                    onClick={() => togglePlayerSelection(player)}
                    className="text-text-secondary hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Performance Rating */}
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Performance</span>
                      <span className="font-medium">{player.stats.performanceRating.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-bg-primary rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, player.stats.performanceRating)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Siegquote</span>
                      <span className="font-medium">{player.stats.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-bg-primary rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${player.stats.winRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Efficiency */}
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Effizienz</span>
                      <span className="font-medium">{player.stats.efficiency.overallEfficiency.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-bg-primary rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${player.stats.efficiency.overallEfficiency}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="text-xs text-text-secondary space-y-1">
                    <div className="flex justify-between">
                      <span>Spiele:</span>
                      <span>{player.stats.totalMatches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Siege:</span>
                      <span className="text-green-500">{player.stats.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sperren:</span>
                      <span className="text-red-500">{player.stats.totalBans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Form:</span>
                      <span className={getFormColor(player.stats.recentForm)}>
                        {getFormLabel(player.stats.recentForm)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Comparison Table */}
          {selectedPlayers.length > 1 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-bg-primary">
                    <th className="pb-2">Metrik</th>
                    {selectedPlayers.map(player => (
                      <th key={player.id} className="pb-2 text-center">{player.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  {getComparisonMetrics().map(metric => (
                    <tr key={metric.key} className="border-b border-bg-primary">
                      <td className="py-2 font-medium">{metric.label}</td>
                      {selectedPlayers.map(player => (
                        <td key={player.id} className="py-2 text-center">
                          {metric.format(player.stats[metric.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Player Selection List */}
      <div className="modern-card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Spieler auswählen ({filteredPlayers.length} verfügbar)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map(player => {
            const isSelected = selectedPlayers.find(p => p.id === player.id);
            
            return (
              <div
                key={player.id}
                className={`player-card cursor-pointer transition-all duration-200 rounded-lg p-4 border-2 ${
                  isSelected 
                    ? 'border-primary bg-primary bg-opacity-10' 
                    : 'border-transparent bg-bg-secondary hover:border-primary hover:border-opacity-50'
                }`}
                onClick={() => togglePlayerSelection(player)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getTeamColor(player.team)}`}></div>
                    <h4 className="font-medium text-text-primary">{player.name}</h4>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <span>Rating:</span>
                    <span className="font-medium">{player.stats.performanceRating.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spiele:</span>
                    <span>{player.stats.totalMatches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Siegquote:</span>
                    <span>{player.stats.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Form:</span>
                    <span className={getFormColor(player.stats.recentForm)}>
                      {getFormLabel(player.stats.recentForm)}
                    </span>
                  </div>
                </div>

                {/* Quick Stats Bar */}
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-bg-primary rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, player.stats.performanceRating)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function calculatePerformanceRating({ winRate, totalMatches, bansPerMatch, totalBans, recentForm }) {
  let rating = 50; // Base rating
  
  // Win rate contribution (0-30 points)
  rating += (winRate / 100) * 30;
  
  // Experience bonus (0-15 points)
  rating += Math.min(15, totalMatches * 0.3);
  
  // Discipline penalty (0-10 points deduction)
  rating -= Math.min(10, bansPerMatch * 20);
  
  // Recent form impact (0-15 points)
  rating += recentForm * 3;
  
  return Math.max(0, Math.min(100, rating));
}

function calculateRecentForm(recentMatches) {
  if (recentMatches.length === 0) return 0;
  
  let formScore = 0;
  recentMatches.forEach((match, index) => {
    const weight = (index + 1) / recentMatches.length; // More recent matches have higher weight
    const isAEK = match.aek_players?.includes(match.player_id);
    const aekScore = match.aek_score || 0;
    const realScore = match.real_score || 0;
    
    if (isAEK ? aekScore > realScore : realScore > aekScore) {
      formScore += 3 * weight; // Win
    } else if (aekScore === realScore) {
      formScore += 1 * weight; // Draw
    }
    // Loss = 0 points
  });
  
  return Math.min(5, formScore);
}

function calculateConsistency(matches) {
  if (matches.length < 3) return 50; // Not enough data
  
  const results = matches.map(match => {
    const isAEK = match.aek_players?.includes(match.player_id);
    const aekScore = match.aek_score || 0;
    const realScore = match.real_score || 0;
    
    if (isAEK ? aekScore > realScore : realScore > aekScore) return 'win';
    if (aekScore === realScore) return 'draw';
    return 'loss';
  });
  
  // Calculate variance in results - lower variance = higher consistency
  const winRate = results.filter(r => r === 'win').length / results.length;
  const variance = results.reduce((acc, result) => {
    const expected = winRate;
    const actual = result === 'win' ? 1 : 0;
    return acc + Math.pow(actual - expected, 2);
  }, 0) / results.length;
  
  return Math.max(0, 100 - (variance * 200));
}

function calculateAverageGoalDifference(matches, playerId) {
  if (matches.length === 0) return 0;
  
  const totalDifference = matches.reduce((sum, match) => {
    const isAEK = match.aek_players?.includes(playerId);
    const aekScore = match.aek_score || 0;
    const realScore = match.real_score || 0;
    const difference = isAEK ? aekScore - realScore : realScore - aekScore;
    return sum + difference;
  }, 0);
  
  return totalDifference / matches.length;
}

function findStrongestOpponent(matches, playerId, allPlayers) {
  // This would need more complex logic to determine opponents
  // For now, return a placeholder
  return 'TBD';
}

function getTeamColor(team) {
  return team === 'AEK' ? 'bg-yellow-500' : 'bg-white';
}

function getFormColor(form) {
  if (form >= 4) return 'text-green-500';
  if (form >= 2) return 'text-yellow-500';
  return 'text-red-500';
}

function getFormLabel(form) {
  if (form >= 4) return 'Excellent';
  if (form >= 3) return 'Good';
  if (form >= 2) return 'Average';
  if (form >= 1) return 'Poor';
  return 'Very Poor';
}

function getComparisonMetrics() {
  return [
    {
      key: 'performanceRating',
      label: 'Performance Rating',
      format: (value) => value.toFixed(1)
    },
    {
      key: 'totalMatches',
      label: 'Spiele gesamt',
      format: (value) => value
    },
    {
      key: 'winRate',
      label: 'Siegquote (%)',
      format: (value) => value.toFixed(1) + '%'
    },
    {
      key: 'totalBans',
      label: 'Sperren gesamt',
      format: (value) => value
    },
    {
      key: 'bansPerMatch',
      label: 'Sperren/Spiel',
      format: (value) => value.toFixed(3)
    },
    {
      key: 'recentForm',
      label: 'Aktuelle Form',
      format: (value) => value.toFixed(1) + '/5'
    }
  ];
}