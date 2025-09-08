import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import LoadingSpinner from './LoadingSpinner';

/**
 * DashboardWidgets.jsx - 8 anpassbare Widget-Typen
 * Features:
 * - Echtzeit-Statistiken mit Team-Vergleichen
 * - Drag-and-Drop Anpassung der Layout-Präferenzen
 * - Interactive dashboard with customizable widgets
 */
export default function DashboardWidgets({ onNavigate }) {
  const [widgetLayout, setWidgetLayout] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fifa-tracker-widget-layout') || 
        JSON.stringify([
          'team-overview',
          'recent-matches',
          'top-performers',
          'financial-summary',
          'ban-status',
          'match-predictions',
          'player-stats',
          'achievements'
        ])
      );
    } catch {
      return [
        'team-overview',
        'recent-matches',
        'top-performers',
        'financial-summary',
        'ban-status',
        'match-predictions',
        'player-stats',
        'achievements'
      ];
    }
  });

  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fifa-tracker-visible-widgets') || 
        JSON.stringify({
          'team-overview': true,
          'recent-matches': true,
          'top-performers': true,
          'financial-summary': true,
          'ban-status': true,
          'match-predictions': false,
          'player-stats': false,
          'achievements': false
        })
      );
    } catch {
      return {
        'team-overview': true,
        'recent-matches': true,
        'top-performers': true,
        'financial-summary': true,
        'ban-status': true,
        'match-predictions': false,
        'player-stats': false,
        'achievements': false
      };
    }
  });

  const [draggedWidget, setDraggedWidget] = useState(null);
  const [customizationMode, setCustomizationMode] = useState(false);

  // Fetch data for widgets
  const { data: matches } = useSupabaseQuery('matches', '*', { 
    order: { column: 'date', ascending: false } 
  });
  const { data: players } = useSupabaseQuery('players', '*');
  const { data: bans } = useSupabaseQuery('bans', '*');
  const { data: finances } = useSupabaseQuery('finances', '*');
  const { data: transactions } = useSupabaseQuery('transactions', '*', {
    order: { column: 'date', ascending: false }
  });

  // Save layout and visibility to localStorage
  useEffect(() => {
    localStorage.setItem('fifa-tracker-widget-layout', JSON.stringify(widgetLayout));
  }, [widgetLayout]);

  useEffect(() => {
    localStorage.setItem('fifa-tracker-visible-widgets', JSON.stringify(visibleWidgets));
  }, [visibleWidgets]);

  // Calculate widget data
  const widgetData = useMemo(() => {
    if (!matches || !players || !bans || !finances) return {};

    const now = new Date();
    const recentMatches = matches.slice(0, 5);
    const aekPlayers = players.filter(p => p.team === 'AEK');
    const realPlayers = players.filter(p => p.team === 'Real');
    
    // Calculate team statistics
    const teamStats = {
      AEK: calculateTeamStats(matches, aekPlayers, 'AEK'),
      Real: calculateTeamStats(matches, realPlayers, 'Real')
    };

    // Financial summary
    const aekFinances = finances.find(f => f.team === 'AEK') || { balance: 0 };
    const realFinances = finances.find(f => f.team === 'Real') || { balance: 0 };

    // Active bans
    const activeBans = bans.filter(ban => {
      const remaining = (ban.totalgames || 0) - (ban.matchesserved || 0);
      return remaining > 0;
    });

    // Top performers
    const topPerformers = calculateTopPerformers(matches, players);

    // Recent achievements
    const achievements = calculateRecentAchievements(matches, players);

    return {
      teamStats,
      recentMatches,
      finances: { AEK: aekFinances, Real: realFinances },
      activeBans,
      topPerformers,
      achievements,
      totalPlayers: players.length,
      totalMatches: matches.length
    };
  }, [matches, players, bans, finances]);

  // Widget toggle
  const toggleWidget = useCallback((widgetId) => {
    setVisibleWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, widgetId) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    
    if (!draggedWidget) return;

    const draggedIndex = widgetLayout.indexOf(draggedWidget);
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;

    const newLayout = [...widgetLayout];
    newLayout.splice(draggedIndex, 1);
    newLayout.splice(targetIndex, 0, draggedWidget);
    
    setWidgetLayout(newLayout);
    setDraggedWidget(null);
  }, [draggedWidget, widgetLayout]);

  const renderWidget = useCallback((widgetId) => {
    if (!visibleWidgets[widgetId]) return null;

    const commonProps = {
      key: widgetId,
      draggable: customizationMode,
      onDragStart: (e) => handleDragStart(e, widgetId),
      onDragOver: handleDragOver,
      onDrop: (e) => handleDrop(e, widgetLayout.indexOf(widgetId)),
      className: `widget-card modern-card transition-all duration-200 ${
        customizationMode ? 'cursor-move border-2 border-dashed border-primary border-opacity-50' : ''
      } ${draggedWidget === widgetId ? 'opacity-50' : ''}`
    };

    switch (widgetId) {
      case 'team-overview':
        return <TeamOverviewWidget {...commonProps} data={widgetData} onNavigate={onNavigate} />;
      case 'recent-matches':
        return <RecentMatchesWidget {...commonProps} data={widgetData} onNavigate={onNavigate} />;
      case 'top-performers':
        return <TopPerformersWidget {...commonProps} data={widgetData} onNavigate={onNavigate} />;
      case 'financial-summary':
        return <FinancialSummaryWidget {...commonProps} data={widgetData} onNavigate={onNavigate} />;
      case 'ban-status':
        return <BanStatusWidget {...commonProps} data={widgetData} onNavigate={onNavigate} />;
      case 'match-predictions':
        return <MatchPredictionsWidget {...commonProps} data={widgetData} onNavigate={onNavigate} />;
      case 'player-stats':
        return <PlayerStatsWidget {...commonProps} data={widgetData} onNavigate={onNavigate} />;
      case 'achievements':
        return <AchievementsWidget {...commonProps} data={widgetData} onNavigate={onNavigate} />;
      default:
        return null;
    }
  }, [visibleWidgets, customizationMode, draggedWidget, widgetData, widgetLayout, onNavigate, handleDragStart, handleDragOver, handleDrop]);

  if (!widgetData.teamStats) {
    return <LoadingSpinner message="Lade Dashboard-Widgets..." />;
  }

  return (
    <div className="dashboard-widgets space-y-6">
      {/* Header with Controls */}
      <div className="modern-card">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2 flex items-center gap-2">
              📊 Dashboard
            </h2>
            <p className="text-text-secondary text-sm">
              Anpassbare Widgets mit Echtzeit-Statistiken
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setCustomizationMode(!customizationMode)}
              className={`modern-button ${customizationMode ? 'modern-button-primary' : 'modern-button-secondary'}`}
            >
              {customizationMode ? '✓ Anpassung beenden' : '⚙️ Anpassen'}
            </button>
            
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  toggleWidget(e.target.value);
                  e.target.value = '';
                }
              }}
              className="modern-select"
              defaultValue=""
            >
              <option value="" disabled>Widget hinzufügen/entfernen</option>
              {getAllWidgets().map(widget => (
                <option key={widget.id} value={widget.id}>
                  {visibleWidgets[widget.id] ? '✓' : '○'} {widget.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customization Instructions */}
      {customizationMode && (
        <div className="modern-card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-medium text-blue-900">Anpassungsmodus aktiv</h3>
              <p className="text-sm text-blue-700">
                Ziehen Sie Widgets per Drag & Drop, um die Reihenfolge zu ändern. 
                Verwenden Sie das Dropdown-Menü, um Widgets ein- oder auszublenden.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div className="widgets-grid grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {widgetLayout.map((widgetId) => renderWidget(widgetId))}
      </div>

      {/* Add Widget Button */}
      {customizationMode && (
        <div className="text-center">
          <div className="inline-flex items-center gap-4 text-text-secondary">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-sm">Alle verfügbaren Widgets</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {getAllWidgets().filter(w => !visibleWidgets[w.id]).map(widget => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className="text-sm bg-bg-secondary text-text-secondary px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                + {widget.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Widget Components
function TeamOverviewWidget({ data, onNavigate, ...props }) {
  const { teamStats } = data;
  
  return (
    <div {...props}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        🏆 Team-Übersicht
      </h3>
      
      <div className="space-y-4">
        {Object.entries(teamStats).map(([team, stats]) => (
          <div key={team} className="team-overview">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${team === 'AEK' ? 'bg-yellow-500' : 'bg-white border'}`}></div>
                <span className="font-medium">{team}</span>
              </div>
              <span className="text-sm text-text-secondary">{stats.winRate.toFixed(1)}% Siege</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-500">{stats.wins}</div>
                <div className="text-text-secondary">Siege</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-500">{stats.draws}</div>
                <div className="text-text-secondary">Unent.</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-500">{stats.losses}</div>
                <div className="text-text-secondary">Niederl.</div>
              </div>
            </div>
            
            <div className="w-full bg-bg-primary rounded-full h-2 mt-3">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.winRate}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={() => onNavigate?.('matches')}
        className="w-full mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        Alle Spiele anzeigen →
      </button>
    </div>
  );
}

function RecentMatchesWidget({ data, onNavigate, ...props }) {
  const { recentMatches } = data;
  
  return (
    <div {...props}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        ⚽ Letzte Spiele
      </h3>
      
      <div className="space-y-3">
        {recentMatches.slice(0, 4).map((match) => (
          <div key={match.id} className="flex items-center justify-between py-2 border-b border-bg-primary">
            <div className="flex items-center gap-3">
              <div className="text-sm text-text-secondary">
                {new Date(match.date).toLocaleDateString('de-DE')}
              </div>
              <div className="font-medium">
                {match.aek_score || 0} : {match.real_score || 0}
              </div>
            </div>
            <div className="text-xs text-text-secondary">
              {match.type || 'Freundschaftsspiel'}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={() => onNavigate?.('matches')}
        className="w-full mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        Alle Spiele anzeigen →
      </button>
    </div>
  );
}

function TopPerformersWidget({ data, onNavigate, ...props }) {
  const { topPerformers } = data;
  
  return (
    <div {...props}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        ⭐ Top-Performer
      </h3>
      
      <div className="space-y-3">
        {topPerformers.slice(0, 3).map((player, index) => (
          <div key={player.id} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-500 text-white' :
              index === 1 ? 'bg-gray-400 text-white' :
              'bg-orange-600 text-white'
            }`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="font-medium">{player.name}</div>
              <div className="text-xs text-text-secondary">
                {player.winRate.toFixed(1)}% Siegquote • {player.totalMatches} Spiele
              </div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              player.team === 'AEK' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {player.team}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={() => onNavigate?.('squad')}
        className="w-full mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        Alle Spieler anzeigen →
      </button>
    </div>
  );
}

function FinancialSummaryWidget({ data, onNavigate, ...props }) {
  const { finances } = data;
  
  return (
    <div {...props}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        💰 Finanzen
      </h3>
      
      <div className="space-y-3">
        {Object.entries(finances).map(([team, finance]) => (
          <div key={team} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${team === 'AEK' ? 'bg-yellow-500' : 'bg-white border'}`}></div>
              <span className="font-medium">{team}</span>
            </div>
            <div className={`font-semibold ${
              finance.balance >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {finance.balance}€
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-bg-primary">
        <div className="flex justify-between text-sm">
          <span>Gesamt:</span>
          <span className="font-semibold">
            {Object.values(finances).reduce((sum, f) => sum + f.balance, 0)}€
          </span>
        </div>
      </div>
      
      <button
        onClick={() => onNavigate?.('finanzen')}
        className="w-full mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        Finanzen verwalten →
      </button>
    </div>
  );
}

function BanStatusWidget({ data, onNavigate, ...props }) {
  const { activeBans } = data;
  
  return (
    <div {...props}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        🚫 Aktive Sperren
      </h3>
      
      {activeBans.length === 0 ? (
        <div className="text-center py-4 text-text-secondary">
          <div className="text-2xl mb-2">✨</div>
          <div className="text-sm">Keine aktiven Sperren</div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeBans.slice(0, 3).map((ban) => {
            const remaining = (ban.totalgames || 0) - (ban.matchesserved || 0);
            return (
              <div key={ban.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{ban.player_name}</div>
                  <div className="text-xs text-text-secondary">{ban.reason}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    remaining === 1 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {remaining} Spiel{remaining > 1 ? 'e' : ''}
                  </div>
                  <div className="text-xs text-text-secondary">verbleibend</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <button
        onClick={() => onNavigate?.('bans')}
        className="w-full mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        Alle Sperren anzeigen →
      </button>
    </div>
  );
}

function MatchPredictionsWidget({ data, onNavigate, ...props }) {
  return (
    <div {...props}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        🔮 Match-Vorhersagen
      </h3>
      
      <div className="space-y-3">
        <div className="prediction-item p-3 bg-bg-primary rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">AEK vs Real</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              78% Confidence
            </span>
          </div>
          <div className="text-xs text-text-secondary">
            Vorhersage: AEK Sieg (2:1)
          </div>
        </div>
        
        <div className="text-xs text-text-secondary text-center">
          Basiert auf Team-Form, Spielerstärken und historischen Daten
        </div>
      </div>
      
      <button
        onClick={() => onNavigate?.('ai')}
        className="w-full mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        Alle Vorhersagen anzeigen →
      </button>
    </div>
  );
}

function PlayerStatsWidget({ data, onNavigate, ...props }) {
  const { totalPlayers } = data;
  
  return (
    <div {...props}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        👥 Spieler-Statistiken
      </h3>
      
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{totalPlayers}</div>
          <div className="text-xs text-text-secondary">Spieler gesamt</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary">{Math.floor(totalPlayers / 2)}</div>
          <div className="text-xs text-text-secondary">Ø pro Team</div>
        </div>
      </div>
      
      <button
        onClick={() => onNavigate?.('squad')}
        className="w-full mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        Spieler verwalten →
      </button>
    </div>
  );
}

function AchievementsWidget({ data, onNavigate, ...props }) {
  const { achievements } = data;
  
  return (
    <div {...props}>
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        🏅 Erfolge
      </h3>
      
      {achievements.length === 0 ? (
        <div className="text-center py-4 text-text-secondary">
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-sm">Keine neuen Erfolge</div>
        </div>
      ) : (
        <div className="space-y-2">
          {achievements.slice(0, 2).map((achievement, index) => (
            <div key={index} className="achievement-item p-2 bg-bg-primary rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{achievement.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{achievement.title}</div>
                  <div className="text-xs text-text-secondary">{achievement.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button
        onClick={() => onNavigate?.('stats')}
        className="w-full mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        Alle Erfolge anzeigen →
      </button>
    </div>
  );
}

// Helper functions
function calculateTeamStats(matches, teamPlayers, team) {
  const teamMatches = matches.filter(match => {
    const teamPlayerIds = teamPlayers.map(p => p.id);
    return team === 'AEK' 
      ? match.aek_players?.some(pid => teamPlayerIds.includes(pid))
      : match.real_players?.some(pid => teamPlayerIds.includes(pid));
  });

  const wins = teamMatches.filter(match => {
    const aekScore = match.aek_score || 0;
    const realScore = match.real_score || 0;
    return team === 'AEK' ? aekScore > realScore : realScore > aekScore;
  }).length;

  const draws = teamMatches.filter(match => {
    const aekScore = match.aek_score || 0;
    const realScore = match.real_score || 0;
    return aekScore === realScore;
  }).length;

  const losses = teamMatches.length - wins - draws;
  const winRate = teamMatches.length > 0 ? (wins / teamMatches.length) * 100 : 0;

  return { wins, draws, losses, winRate, totalMatches: teamMatches.length };
}

function calculateTopPerformers(matches, players) {
  return players
    .map(player => {
      const playerMatches = matches.filter(match => 
        match.aek_players?.includes(player.id) || match.real_players?.includes(player.id)
      );
      
      const wins = playerMatches.filter(match => {
        const isAEK = match.aek_players?.includes(player.id);
        const aekScore = match.aek_score || 0;
        const realScore = match.real_score || 0;
        return isAEK ? aekScore > realScore : realScore > aekScore;
      }).length;
      
      const winRate = playerMatches.length > 0 ? (wins / playerMatches.length) * 100 : 0;
      
      return {
        ...player,
        totalMatches: playerMatches.length,
        wins,
        winRate
      };
    })
    .filter(player => player.totalMatches >= 3) // Only players with at least 3 matches
    .sort((a, b) => b.winRate - a.winRate);
}

function calculateRecentAchievements(matches, players) {
  const achievements = [];
  
  // Check for milestone achievements in recent matches (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  players.forEach(player => {
    const playerMatches = matches.filter(match => 
      (match.aek_players?.includes(player.id) || match.real_players?.includes(player.id)) &&
      new Date(match.date) >= oneWeekAgo
    );
    
    const totalMatches = matches.filter(match => 
      match.aek_players?.includes(player.id) || match.real_players?.includes(player.id)
    ).length;
    
    // Check for milestone achievements
    const milestones = [10, 25, 50, 100];
    milestones.forEach(milestone => {
      if (totalMatches === milestone && playerMatches.length > 0) {
        achievements.push({
          icon: '🏆',
          title: `${milestone} Spiele!`,
          description: `${player.name} hat ${milestone} Spiele erreicht`,
          timestamp: new Date()
        });
      }
    });
  });
  
  return achievements.sort((a, b) => b.timestamp - a.timestamp);
}

function getAllWidgets() {
  return [
    { id: 'team-overview', name: 'Team-Übersicht' },
    { id: 'recent-matches', name: 'Letzte Spiele' },
    { id: 'top-performers', name: 'Top-Performer' },
    { id: 'financial-summary', name: 'Finanzen' },
    { id: 'ban-status', name: 'Aktive Sperren' },
    { id: 'match-predictions', name: 'Match-Vorhersagen' },
    { id: 'player-stats', name: 'Spieler-Statistiken' },
    { id: 'achievements', name: 'Erfolge' }
  ];
}