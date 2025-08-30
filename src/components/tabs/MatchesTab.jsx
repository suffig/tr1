import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

export default function MatchesTab() {
  const { data: matches, loading, error, refetch } = useSupabaseQuery(
    'matches',
    '*',
    { order: { column: 'datum', ascending: false }, limit: 50 }
  );
  const { insert, update, remove } = useSupabaseMutation('matches');

  // Minimal CRUD functions without changing the design
  const handleAddMatch = async () => {
    const team1 = prompt('Heimteam:');
    if (!team1) return;
    
    const team2 = prompt('Gastteam:');
    if (!team2) return;
    
    const datum = prompt('Datum (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!datum) return;
    
    const tore1 = prompt('Tore Heimteam:', '0');
    const tore2 = prompt('Tore Gastteam:', '0');
    
    try {
      await insert({
        team1: team1.trim(),
        team2: team2.trim(),
        datum: datum,
        tore1: parseInt(tore1) || 0,
        tore2: parseInt(tore2) || 0,
        status: 'finished',
        beschreibung: ''
      });
      refetch();
    } catch (error) {
      alert('Fehler beim Hinzufügen des Spiels: ' + error.message);
    }
  };

  const handleEditMatch = async (match) => {
    const newScore1 = prompt('Tore ' + match.team1 + ':', match.tore1.toString());
    if (newScore1 === null) return;
    
    const newScore2 = prompt('Tore ' + match.team2 + ':', match.tore2.toString());
    if (newScore2 === null) return;
    
    try {
      await update({
        tore1: parseInt(newScore1) || 0,
        tore2: parseInt(newScore2) || 0
      }, match.id);
      refetch();
    } catch (error) {
      alert('Fehler beim Aktualisieren des Spiels: ' + error.message);
    }
  };

  const handleDeleteMatch = async (match) => {
    if (!confirm(`Sind Sie sicher, dass Sie das Spiel ${match.team1} vs ${match.team2} löschen möchten?`)) return;
    
    try {
      await remove(match.id);
      refetch();
    } catch (error) {
      alert('Fehler beim Löschen des Spiels: ' + error.message);
    }
  };

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
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-text-primary">
            Spiele
          </h2>
          <button 
            onClick={handleAddMatch}
            className="btn-primary text-sm"
          >
            <i className="fas fa-plus mr-2"></i>
            Neues Spiel
          </button>
        </div>
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
                <div className="flex items-center space-x-3">
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
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleEditMatch(match)}
                      className="text-text-muted hover:text-primary-green transition-colors p-1"
                      title="Bearbeiten"
                    >
                      <i className="fas fa-edit text-sm"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(match)}
                      className="text-text-muted hover:text-accent-red transition-colors p-1"
                      title="Löschen"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
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