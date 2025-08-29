import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

export default function StatsTab() {
  const { data: matches, loading: matchesLoading } = useSupabaseQuery('matches', '*');
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  
  const loading = matchesLoading || playersLoading;

  // Basic statistics calculations
  const totalMatches = matches?.length || 0;
  const totalPlayers = players?.length || 0;
  const aekPlayers = players?.filter(p => p.team === 'AEK').length || 0;
  const realPlayers = players?.filter(p => p.team === 'Real').length || 0;

  // Calculate total goals
  const totalGoals = matches?.reduce((total, match) => {
    return total + (match.tore1 || 0) + (match.tore2 || 0);
  }, 0) || 0;

  // Calculate wins per team
  const aekWins = matches?.filter(match => 
    (match.team1 === 'AEK' && match.tore1 > match.tore2) ||
    (match.team2 === 'AEK' && match.tore2 > match.tore1)
  ).length || 0;

  const realWins = matches?.filter(match => 
    (match.team1 === 'Real' && match.tore1 > match.tore2) ||
    (match.team2 === 'Real' && match.tore2 > match.tore1)
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
                <span className="font-medium">{aekPlayers}</span>
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
                <span className="font-medium">{realPlayers}</span>
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

      {/* Recent Activity */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Letzte Aktivität
        </h3>
        
        {matches && matches.length > 0 ? (
          <div className="space-y-3">
            {matches
              .sort((a, b) => new Date(b.datum) - new Date(a.datum))
              .slice(0, 5)
              .map((match) => (
                <div key={match.id} className="modern-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-text-primary">
                        {match.team1} vs {match.team2}
                      </div>
                      <div className="text-sm text-text-muted">
                        {new Date(match.datum).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-text-primary">
                        {match.tore1} : {match.tore2}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-text-muted">Noch keine Spiele für Statistiken verfügbar</p>
          </div>
        )}
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