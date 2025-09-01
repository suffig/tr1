import { useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

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
      const matchGoals = this.countPlayerGoalsFromMatches(player.name, player.team);
      const matchesPlayed = this.countPlayerMatches(player.name, player.team);
      const playerBans = this.bans.filter(b => b.player_id === player.id);
      
      const sdsRecord = this.spielerDesSpiels.find(sds => 
        sds.name === player.name && sds.team === player.team
      );
      const sdsCount = sdsRecord ? (sdsRecord.count || 0) : 0;
      
      return {
        ...player,
        goals: matchGoals,
        matchesPlayed,
        sdsCount,
        goalsPerGame: matchesPlayed > 0 ? (matchGoals / matchesPlayed).toFixed(2) : '0.00',
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

  countPlayerMatches(playerName, playerTeam) {
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
}

export default function StatsTab() {
  const [selectedView, setSelectedView] = useState('overview');
  
  const { data: matches, loading: matchesLoading } = useSupabaseQuery('matches', '*');
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  const { data: sdsData, loading: sdsLoading } = useSupabaseQuery('spieler_des_spiels', '*');
  const { data: bans, loading: bansLoading } = useSupabaseQuery('bans', '*');
  
  const loading = matchesLoading || playersLoading || sdsLoading || bansLoading;

  // Initialize statistics calculator
  const stats = new StatsCalculator(matches, players, bans, sdsData);
  
  // Calculate all statistics
  const teamRecords = stats.calculateTeamRecords();
  const recentForm = stats.calculateRecentForm(5);
  const playerStats = stats.calculatePlayerStats();
  const advancedStats = stats.calculateAdvancedStats();
  const performanceTrends = stats.calculatePerformanceTrends();

  // Basic data calculations
  const totalMatches = matches?.length || 0;
  const totalPlayers = players?.length || 0;
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

  const formatCurrencyInMillions = (amount) => {
    // Values are already stored in millions in the database
    return `${(amount || 0).toFixed(1)}M €`;
  };

  const formatPlayerValue = (value) => {
    // Helper function for consistent player value formatting
    // Values are stored as millions in database  
    return `${(value || 0).toFixed(1)}M €`;
  };

  const views = [
    { id: 'overview', label: 'Übersicht', icon: '📊' },
    { id: 'players', label: 'Spieler', icon: '👥' },
    { id: 'teams', label: 'Teams', icon: '🏆' },
    { id: 'trends', label: 'Trends', icon: '📈' },
  ];

  if (loading) {
    return <LoadingSpinner message="Lade Statistiken..." />;
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-primary-green">{totalMatches}</div>
          <div className="text-sm text-text-muted">Spiele</div>
        </div>
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-primary-green">{advancedStats.totalGoals}</div>
          <div className="text-sm text-text-muted">Tore</div>
        </div>
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-primary-green">{totalPlayers}</div>
          <div className="text-sm text-text-muted">Spieler</div>
        </div>
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-primary-green">{advancedStats.avgGoalsPerMatch}</div>
          <div className="text-sm text-text-muted">⌀ Tore/Spiel</div>
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
            {playerStats.map((player, index) => (
              <tr key={player.id} className="border-b border-border-light hover:bg-bg-secondary">
                <td className="py-2 font-medium">{player.name}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    player.team === 'AEK' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
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
                <span>Spieler:</span>
                <span className="font-medium">{aekPlayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tore gesamt:</span>
                <span className="font-medium">{advancedStats.aekTotalGoals}</span>
              </div>
              <div className="flex justify-between">
                <span>Siege:</span>
                <span className="font-medium">{aekWins}</span>
              </div>
              <div className="flex justify-between">
                <span>Siegquote:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? ((aekWins / totalMatches) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-red-600">Real Madrid</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Spieler:</span>
                <span className="font-medium">{realPlayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tore gesamt:</span>
                <span className="font-medium">{advancedStats.realTotalGoals}</span>
              </div>
              <div className="flex justify-between">
                <span>Siege:</span>
                <span className="font-medium">{realWins}</span>
              </div>
              <div className="flex justify-between">
                <span>Siegquote:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? ((realWins / totalMatches) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Team Stats */}
      <div className="modern-card">
        <h3 className="font-bold text-lg mb-4">📈 Erweiterte Statistiken</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary-green">{advancedStats.highestScoringMatch}</div>
            <div className="text-sm text-text-muted">Tore in einem Spiel</div>
          </div>
          <div className="text-center p-4 bg-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary-green">{formatPlayerValue(totalMarketValue)}</div>
            <div className="text-sm text-text-muted">Gesamtmarktwert</div>
          </div>
          <div className="text-center p-4 bg-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary-green">{Math.abs(aekWins - realWins)}</div>
            <div className="text-sm text-text-muted">Siegesdifferenz</div>
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

  const renderCurrentView = () => {
    switch (selectedView) {
      case 'players': return renderPlayers();
      case 'teams': return renderTeams();
      case 'trends': return renderTrends();
      default: return renderOverview();
    }
  };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">📊 Statistiken</h2>
        <p className="text-text-muted">Umfassende Analyse von Spielen, Spielern und Teams</p>
      </div>

      {/* View Navigation */}
      <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedView === view.id
                ? 'bg-primary-green text-white'
                : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
            }`}
          >
            <span>{view.icon}</span>
            <span className="font-medium">{view.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {renderCurrentView()}
    </div>
  );
}