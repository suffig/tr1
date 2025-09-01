import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

export default function StatsTab() {
  const { data: matches, loading: matchesLoading } = useSupabaseQuery('matches', '*');
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  const { data: sdsData, loading: sdsLoading } = useSupabaseQuery('spieler_des_spiels', '*');
  
  const loading = matchesLoading || playersLoading || sdsLoading;

  // Basic statistics calculations
  const totalMatches = matches?.length || 0;
  const totalPlayers = players?.length || 0;
  const aekPlayers = players?.filter(p => p.team === 'AEK') || [];
  const realPlayers = players?.filter(p => p.team === 'Real') || [];

  // Calculate total goals
  const totalGoals = matches?.reduce((total, match) => {
    return total + (match.goalsa || 0) + (match.goalsb || 0);
  }, 0) || 0;

  // Calculate market values
  const aekMarketValue = aekPlayers.reduce((total, player) => total + (player.value || 0), 0);
  const realMarketValue = realPlayers.reduce((total, player) => total + (player.value || 0), 0);
  const totalMarketValue = aekMarketValue + realMarketValue;

  // Calculate goal scorers from matches
  const calculateTopScorers = () => {
    const scorers = {};
    
    matches?.forEach(match => {
      // Process AEK goals - safely parse goalslista
      let goalsListA = [];
      try {
        if (typeof match.goalslista === 'string') {
          goalsListA = JSON.parse(match.goalslista);
        } else if (Array.isArray(match.goalslista)) {
          goalsListA = match.goalslista;
        }
      } catch (e) {
        console.warn('Failed to parse goalslista in stats:', e);
        goalsListA = [];
      }
      
      goalsListA?.forEach(goal => {
        const isObject = typeof goal === 'object' && goal !== null;
        const playerName = isObject ? goal.player : goal;
        const goalCount = isObject ? (goal.count || 1) : 1;
        
        if (!scorers[playerName]) {
          const player = players?.find(p => p.name === playerName);
          scorers[playerName] = {
            name: playerName,
            goals: 0,
            team: player?.team || 'AEK',
            value: player?.value || 0
          };
        }
        scorers[playerName].goals += goalCount;
      });
      
      // Process Real goals - safely parse goalslistb
      let goalsListB = [];
      try {
        if (typeof match.goalslistb === 'string') {
          goalsListB = JSON.parse(match.goalslistb);
        } else if (Array.isArray(match.goalslistb)) {
          goalsListB = match.goalslistb;
        }
      } catch (e) {
        console.warn('Failed to parse goalslistb in stats:', e);
        goalsListB = [];
      }
      
      goalsListB?.forEach(goal => {
        const isObject = typeof goal === 'object' && goal !== null;
        const playerName = isObject ? goal.player : goal;
        const goalCount = isObject ? (goal.count || 1) : 1;
        
        if (!scorers[playerName]) {
          const player = players?.find(p => p.name === playerName);
          scorers[playerName] = {
            name: playerName,
            goals: 0,
            team: player?.team || 'Real',
            value: player?.value || 0
          };
        }
        scorers[playerName].goals += goalCount;
      });
    });
    
    return Object.values(scorers).sort((a, b) => b.goals - a.goals).slice(0, 5);
  };

  // Calculate Player of the Match (SdS) counts from both sources
  const calculateSdsStats = () => {
    const sdsCount = {};
    
    // First, add data from the dedicated spieler_des_spiels table
    sdsData?.forEach(sdsEntry => {
      const player = players?.find(p => p.name === sdsEntry.name && p.team === sdsEntry.team);
      sdsCount[sdsEntry.name] = {
        name: sdsEntry.name,
        count: sdsEntry.count || 0,
        team: sdsEntry.team,
        value: player?.value || 0
      };
    });
    
    // Then, add data from matches table (manofthematch field)
    matches?.forEach(match => {
      if (match.manofthematch) {
        if (!sdsCount[match.manofthematch]) {
          const player = players?.find(p => p.name === match.manofthematch);
          sdsCount[match.manofthematch] = {
            name: match.manofthematch,
            count: 0,
            team: player?.team || 'Unbekannt',
            value: player?.value || 0
          };
        }
        sdsCount[match.manofthematch].count++;
      }
    });
    
    return Object.values(sdsCount).sort((a, b) => b.count - a.count).slice(0, 10); // Show top 10 instead of 5
  };

  const topScorers = calculateTopScorers();
  const sdsStats = calculateSdsStats();

  // Calculate wins per team
  const aekWins = matches?.filter(match => 
    (match.teama === 'AEK' && match.goalsa > match.goalsb) ||
    (match.teamb === 'AEK' && match.goalsb > match.goalsa)
  ).length || 0;

  const realWins = matches?.filter(match => 
    (match.teama === 'Real' && match.goalsa > match.goalsb) ||
    (match.teamb === 'Real' && match.goalsb > match.goalsa)
  ).length || 0;

  if (loading) {
    return <LoadingSpinner message="Lade Statistiken..." />;
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Statistiken
        </h2>
        <p className="text-text-muted">
          Übersicht über alle wichtigen Zahlen
        </p>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="modern-card text-center">
          <div className="text-3xl font-bold text-primary-green mb-2">
            {totalMatches}
          </div>
          <div className="text-sm text-text-muted">Gesamt Spiele</div>
        </div>
        
        <div className="modern-card text-center">
          <div className="text-3xl font-bold text-accent-orange mb-2">
            {totalGoals}
          </div>
          <div className="text-sm text-text-muted">Gesamt Tore</div>
        </div>
        
        <div className="modern-card text-center">
          <div className="text-3xl font-bold text-accent-blue mb-2">
            {totalPlayers}
          </div>
          <div className="text-sm text-text-muted">Gesamt Spieler</div>
        </div>
        
        <div className="modern-card text-center">
          <div className="text-3xl font-bold text-text-primary mb-2">
            {totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0.0'}
          </div>
          <div className="text-sm text-text-muted">⌀ Tore/Spiel</div>
        </div>
      </div>

      {/* Market Value Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Marktwert-Statistiken
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card text-center border-l-4 border-blue-400">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {aekMarketValue.toFixed(1)}M €
            </div>
            <div className="text-sm text-text-muted">AEK Kaderwert</div>
          </div>
          
          <div className="modern-card text-center border-l-4 border-red-400">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {realMarketValue.toFixed(1)}M €
            </div>
            <div className="text-sm text-text-muted">Real Kaderwert</div>
          </div>
          
          <div className="modern-card text-center border-l-4 border-green-400">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {totalMarketValue.toFixed(1)}M €
            </div>
            <div className="text-sm text-text-muted">Gesamt Kaderwert</div>
          </div>
        </div>
      </div>

      {/* Team Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Team-Statistiken
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AEK Stats */}
          <div className="modern-card border-l-4 border-blue-400">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🔵</span>
              <h4 className="text-lg font-semibold text-blue-600">AEK Athen</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Spieler:</span>
                <span className="font-medium">{aekPlayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Siege:</span>
                <span className="font-medium text-primary-green">{aekWins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Siegesrate:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? ((aekWins / totalMatches) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Real Stats */}
          <div className="modern-card border-l-4 border-purple-400">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🟣</span>
              <h4 className="text-lg font-semibold text-purple-600">Real Madrid</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Spieler:</span>
                <span className="font-medium">{realPlayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Siege:</span>
                <span className="font-medium text-primary-green">{realWins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Siegesrate:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? ((realWins / totalMatches) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Scorers */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          ⚽ Top Torschützen
        </h3>
        
        {topScorers.length > 0 ? (
          <div className="space-y-3">
            {topScorers.map((scorer, index) => (
              <div key={scorer.name} className="modern-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-text-muted'}`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{scorer.name}</div>
                      <div className="text-sm text-text-muted">
                        {scorer.team} • Marktwert: {scorer.value.toFixed(1)}M €
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-green">{scorer.goals}</div>
                    <div className="text-xs text-text-muted">Tore</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚽</div>
            <p className="text-text-muted">Noch keine Torschützen verfügbar</p>
          </div>
        )}
      </div>

      {/* Player of the Match (SdS) Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          ⭐ Spieler des Spiels (SdS)
        </h3>
        
        {sdsStats.length > 0 ? (
          <div className="space-y-3">
            {sdsStats.map((sds, index) => (
              <div key={sds.name} className="modern-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-text-muted'}`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{sds.name}</div>
                      <div className="text-sm text-text-muted">
                        {sds.team} • Marktwert: {sds.value.toFixed(1)}M €
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600">{sds.count}</div>
                    <div className="text-xs text-text-muted">SdS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⭐</div>
            <p className="text-text-muted">Noch keine Spieler des Spiels vergeben</p>
          </div>
        )}
      </div>

      {/* Additional Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          📊 Weitere Statistiken
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="modern-card text-center">
            <div className="text-2xl font-bold text-accent-orange mb-2">
              {matches?.filter(m => m.goalsa === m.goalsb).length || 0}
            </div>
            <div className="text-sm text-text-muted">Unentschieden</div>
          </div>
          
          <div className="modern-card text-center">
            <div className="text-2xl font-bold text-accent-red mb-2">
              {matches?.reduce((sum, m) => sum + (m.reda || 0) + (m.redb || 0), 0) || 0}
            </div>
            <div className="text-sm text-text-muted">Rote Karten</div>
          </div>
          
          <div className="modern-card text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {matches?.reduce((sum, m) => sum + (m.yellowa || 0) + (m.yellowb || 0), 0) || 0}
            </div>
            <div className="text-sm text-text-muted">Gelbe Karten</div>
          </div>
          
          <div className="modern-card text-center">
            <div className="text-2xl font-bold text-primary-green mb-2">
              {totalMatches > 0 ? Math.max(...matches.map(m => (m.goalsa || 0) + (m.goalsb || 0))) : 0}
            </div>
            <div className="text-sm text-text-muted">Höchstes Ergebnis</div>
          </div>
        </div>
      </div>

      {/* Team Performance Comparison */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          ⚖️ Team-Vergleich
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="modern-card border-l-4 border-blue-400">
            <h4 className="text-lg font-semibold text-blue-600 mb-3">🔵 AEK Athen</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Durchschn. Tore pro Spiel:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? 
                    (matches.reduce((sum, m) => sum + (m.teama === 'AEK' ? (m.goalsa || 0) : (m.goalsb || 0)), 0) / totalMatches).toFixed(1) 
                    : '0.0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Durchschn. Gegentore:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? 
                    (matches.reduce((sum, m) => sum + (m.teama === 'AEK' ? (m.goalsb || 0) : (m.goalsa || 0)), 0) / totalMatches).toFixed(1) 
                    : '0.0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Beste Scorer:</span>
                <span className="font-medium">
                  {topScorers.filter(s => s.team === 'AEK').length > 0 
                    ? topScorers.filter(s => s.team === 'AEK')[0].name 
                    : 'Keine'}
                </span>
              </div>
            </div>
          </div>

          <div className="modern-card border-l-4 border-red-400">
            <h4 className="text-lg font-semibold text-red-600 mb-3">🔴 Real Madrid</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Durchschn. Tore pro Spiel:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? 
                    (matches.reduce((sum, m) => sum + (m.teamb === 'Real' ? (m.goalsb || 0) : (m.goalsa || 0)), 0) / totalMatches).toFixed(1) 
                    : '0.0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Durchschn. Gegentore:</span>
                <span className="font-medium">
                  {totalMatches > 0 ? 
                    (matches.reduce((sum, m) => sum + (m.teamb === 'Real' ? (m.goalsa || 0) : (m.goalsb || 0)), 0) / totalMatches).toFixed(1) 
                    : '0.0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Beste Scorer:</span>
                <span className="font-medium">
                  {topScorers.filter(s => s.team === 'Real').length > 0 
                    ? topScorers.filter(s => s.team === 'Real')[0].name 
                    : 'Keine'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Development Note */}
      <div className="modern-card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Statistiken-Modul</h4>
            <p className="text-blue-700 text-sm">
              Grundlegende Statistiken sind implementiert. Erweiterte Analysen und Charts können 
              bei Bedarf hinzugefügt werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}