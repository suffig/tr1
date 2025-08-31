import { useSupabaseMutation } from '../../../hooks/useSupabase';

export default function AddMatchTab() {
  const { insert } = useSupabaseMutation('matches');

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
      alert('Spiel erfolgreich hinzugefügt!');
    } catch (error) {
      alert('Fehler beim Hinzufügen des Spiels: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Neues Spiel hinzufügen
        </h3>
        <p className="text-text-muted text-sm">
          Fügen Sie ein neues Spiel zur Datenbank hinzu.
        </p>
      </div>

      <div className="modern-card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚽</div>
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Spiel hinzufügen
          </h4>
          <p className="text-text-muted mb-6">
            Klicken Sie auf den Button, um ein neues Spiel zu erfassen.
          </p>
          
          <button 
            onClick={handleAddMatch}
            className="btn-primary"
          >
            <i className="fas fa-plus mr-2"></i>
            Neues Spiel erfassen
          </button>
        </div>
      </div>

      <div className="mt-6 modern-card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Hinweis</h4>
            <p className="text-blue-700 text-sm">
              Nach dem Hinzufügen können Sie das Spiel in der Spiele-Übersicht einsehen und bearbeiten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}