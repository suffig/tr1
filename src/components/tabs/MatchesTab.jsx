import { useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

export default function MatchesTab() {
  const [expandedMatches, setExpandedMatches] = useState(new Set());
  
  const { data: matches, loading, error, refetch } = useSupabaseQuery(
    'matches',
    '*',
    { order: { column: 'date', ascending: false }, limit: 50 }
  );
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');

  const isLoading = loading || playersLoading;

  // Helper function to get player name and value
  const getPlayerInfo = (playerId, playerName) => {
    if (!players) return { name: playerName || 'Unbekannt', value: 0 };
    const player = players.find(p => p.id === playerId || p.name === playerName);
    return {
      name: player?.name || playerName || 'Unbekannt',
      value: player?.value || 0,
      team: player?.team || 'Unbekannt'
    };
  };

  // Helper function to get player name only (for backwards compatibility)
  const getPlayerName = (playerName) => playerName || 'Unbekannt';

  const toggleMatchDetails = (matchId) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  // Group matches by date
  const groupMatchesByDate = () => {
    if (!matches) return [];
    
    const groups = {};
    matches.forEach(match => {
      const dateKey = match.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(match);
    });
    
    // Sort dates descending and return as array
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date,
        matches: groups[date].sort((a, b) => b.id - a.id) // Sort matches by ID descending
      }));
  };

  // Generate color schemes for different dates
  const getDateColorScheme = (index) => {
    const colorSchemes = [
      {
        container: "border-blue-400 bg-blue-50 dark:bg-blue-900",
        header: "text-blue-800 dark:text-blue-100",
        accent: "blue-500"
      },
      {
        container: "border-green-500 bg-green-50 dark:bg-green-900", 
        header: "text-green-800 dark:text-green-100",
        accent: "green-500"
      },
      {
        container: "border-purple-500 bg-purple-50 dark:bg-purple-900",
        header: "text-purple-800 dark:text-purple-100", 
        accent: "purple-500"
      },
      {
        container: "border-red-500 bg-red-50 dark:bg-red-900",
        header: "text-red-800 dark:text-red-100", 
        accent: "red-500"
      },
      {
        container: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900",
        header: "text-yellow-800 dark:text-yellow-100",
        accent: "yellow-500"
      }
    ];
    
    return colorSchemes[index % colorSchemes.length];
  };

  if (isLoading) {
    return <LoadingSpinner message="Lade Spiele..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-accent-red mb-4">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <p className="text-text-muted mb-4">Fehler beim Laden der Spiele</p>
        <button onClick={refetch} className="btn-primary">
          Erneut versuchen
        </button>
      </div>
    );
  }

  const dateGroups = groupMatchesByDate();

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-text-primary">
            Spiele-Übersicht
          </h2>
        </div>
        <p className="text-text-muted">
          {matches?.length || 0} Spiele gefunden, gruppiert nach Datum
        </p>
      </div>

      {dateGroups && dateGroups.length > 0 ? (
        <div className="space-y-4">
          {dateGroups.map((dateGroup, groupIndex) => {
            const colorScheme = getDateColorScheme(groupIndex);
            
            return (
              <div key={dateGroup.date} className={`border-2 ${colorScheme.container} rounded-lg shadow-lg`}>
                <div className="p-4 border-b border-opacity-20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 bg-${colorScheme.accent} rounded-full mr-3 flex-shrink-0`}></div>
                      <div>
                        <h3 className={`text-lg font-bold ${colorScheme.header}`}>
                          {new Date(dateGroup.date).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className={`text-sm opacity-75 ${colorScheme.header}`}>
                          {dateGroup.matches.length} Spiel{dateGroup.matches.length !== 1 ? 'e' : ''}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xs bg-${colorScheme.accent} text-white px-3 py-1 rounded-full font-semibold`}>
                      Spieltag
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {dateGroup.matches.map((match) => {
                    const isExpanded = expandedMatches.has(match.id);
                    
                    return (
                      <div key={match.id} className="bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30">
                        <button
                          onClick={() => toggleMatchDetails(match.id)}
                          className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-text-primary">
                                {match.teama || 'AEK'} {match.goalsa || 0} : {match.goalsb || 0} {match.teamb || 'Real'}
                              </div>
                              {match.status && (
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                                  match.status === 'finished' 
                                    ? 'bg-primary-green/10 text-primary-green'
                                    : 'bg-accent-orange/10 text-accent-orange'
                                }`}>
                                  {match.status === 'finished' ? 'Beendet' : 'Laufend'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Details</span>
                            <span className={`text-lg transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              ▶
                            </span>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              
                              {/* Goal Scorers */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-text-primary flex items-center">
                                  ⚽ Torschützen
                                </h4>
                                <div className="space-y-2">
                                  {match.goalslista && match.goalslista.length > 0 ? (
                                    <div>
                                      <p className="text-xs text-blue-600 font-medium mb-1">AEK:</p>
                                      {match.goalslista.map((goal, idx) => {
                                        const isObject = typeof goal === 'object' && goal !== null;
                                        const playerInfo = isObject 
                                          ? getPlayerInfo(goal.player_id, goal.player)
                                          : getPlayerInfo(null, goal);
                                        return (
                                          <div key={idx} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                            <div className="font-medium text-blue-800">
                                              {playerInfo.name}
                                              {isObject && goal.count > 1 && (
                                                <span className="ml-1 text-xs bg-blue-200 px-1 rounded">
                                                  {goal.count}x
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-xs text-blue-600">
                                              Marktwert: {playerInfo.value}M €
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : <p className="text-xs text-text-muted">AEK: Keine Tore</p>}
                                  
                                  {match.goalslistb && match.goalslistb.length > 0 ? (
                                    <div>
                                      <p className="text-xs text-red-600 font-medium mb-1">Real:</p>
                                      {match.goalslistb.map((goal, idx) => {
                                        const isObject = typeof goal === 'object' && goal !== null;
                                        const playerInfo = isObject 
                                          ? getPlayerInfo(goal.player_id, goal.player)
                                          : getPlayerInfo(null, goal);
                                        return (
                                          <div key={idx} className="text-sm p-2 bg-red-50 rounded border-l-4 border-red-400">
                                            <div className="font-medium text-red-800">
                                              {playerInfo.name}
                                              {isObject && goal.count > 1 && (
                                                <span className="ml-1 text-xs bg-red-200 px-1 rounded">
                                                  {goal.count}x
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-xs text-red-600">
                                              Marktwert: {playerInfo.value}M €
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : <p className="text-xs text-text-muted">Real: Keine Tore</p>}
                                </div>
                              </div>
                              
                              {/* Player of the Match (SdS) */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-text-primary flex items-center">
                                  ⭐ Spieler des Spiels
                                </h4>
                                <div className="space-y-1">
                                  {match.manofthematch ? (
                                    <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                      <div className="font-medium text-yellow-800">
                                        {match.manofthematch}
                                      </div>
                                      {(() => {
                                        const playerInfo = getPlayerInfo(match.manofthematch_player_id, match.manofthematch);
                                        return (
                                          <div className="text-xs text-yellow-600">
                                            Team: {playerInfo.team} | Marktwert: {playerInfo.value}M €
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-text-muted">Kein Spieler des Spiels ausgewählt</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Cards */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-text-primary flex items-center">
                                  🟨🟥 Karten
                                </h4>
                                <div className="space-y-1">
                                  <div>
                                    <p className="text-xs text-blue-600 font-medium">AEK:</p>
                                    <p className="text-sm text-text-muted">🟨 {match.yellowa || 0} Gelb</p>
                                    <p className="text-sm text-text-muted">🟥 {match.reda || 0} Rot</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-red-600 font-medium">Real:</p>
                                    <p className="text-sm text-text-muted">🟨 {match.yellowb || 0} Gelb</p>
                                    <p className="text-sm text-text-muted">🟥 {match.redb || 0} Rot</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Prize Money */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-text-primary flex items-center">
                                  💰 Preisgelder
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-sm text-text-muted">
                                    <span className="text-blue-600">AEK:</span> {match.prizeaek ? `€${match.prizeaek}` : '€0'}
                                  </p>
                                  <p className="text-sm text-text-muted">
                                    <span className="text-red-600">Real:</span> {match.prizereal ? `€${match.prizereal}` : '€0'}
                                  </p>
                                </div>
                              </div>
                              
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-text-muted mb-4">
            <i className="fas fa-futbol text-4xl opacity-50"></i>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Keine Spiele gefunden
          </h3>
          <p className="text-text-muted">
            Es wurden noch keine Spiele hinzugefügt.
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 modern-card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Hinweis</h4>
            <p className="text-blue-700 text-sm">
              Klicken Sie auf ein Spiel, um detaillierte Statistiken wie Torschützen, Karten und Preisgelder anzuzeigen. Neue Spiele können im Verwaltungsbereich hinzugefügt werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}