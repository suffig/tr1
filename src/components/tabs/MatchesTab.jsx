import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

export default function MatchesTab() {
  const { data: matches, loading, error, refetch } = useSupabaseQuery(
    'matches',
    '*',
    { order: { column: 'datum', ascending: false }, limit: 50 }
  );

  if (loading) {
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

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Spiele
        </h2>
        <p className="text-text-muted">
          {matches?.length || 0} Spiele gefunden
        </p>
      </div>

      {matches && matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="modern-card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">
                    {match.team1} vs {match.team2}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {new Date(match.datum).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-text-primary">
                    {match.tore1} : {match.tore2}
                  </div>
                  {match.status && (
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      match.status === 'finished' 
                        ? 'bg-primary-green/10 text-primary-green'
                        : 'bg-accent-orange/10 text-accent-orange'
                    }`}>
                      {match.status === 'finished' ? 'Beendet' : 'Laufend'}
                    </span>
                  )}
                </div>
              </div>
              
              {match.beschreibung && (
                <p className="text-sm text-text-muted border-t pt-3 mt-3">
                  {match.beschreibung}
                </p>
              )}
            </div>
          ))}
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
    </div>
  );
}