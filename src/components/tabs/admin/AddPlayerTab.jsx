import { useSupabaseMutation } from '../../../hooks/useSupabase';

const POSITIONS = [
  { value: 'TH', label: 'Torwart (TH)' },
  { value: 'IV', label: 'Innenverteidiger (IV)' },
  { value: 'AV', label: 'Außenverteidiger (AV)' },
  { value: 'ZM', label: 'Zentrales Mittelfeld (ZM)' },
  { value: 'OM', label: 'Offensives Mittelfeld (OM)' },
  { value: 'ST', label: 'Stürmer (ST)' },
];

const TEAMS = [
  { value: 'AEK', label: 'AEK Athen' },
  { value: 'Real', label: 'Real Madrid' },
  { value: 'Ehemalige', label: 'Ehemalige' },
];

export default function AddPlayerTab() {
  const { insert } = useSupabaseMutation('players');

  const handleAddPlayer = async () => {
    const name = prompt('Spielername:');
    if (!name) return;
    
    const team = prompt(`Team (${TEAMS.map(t => t.value).join(', ')}):`, 'AEK');
    if (!team) return;
    
    const position = prompt(`Position (${POSITIONS.map(p => p.value).join(', ')}):`, 'ST');
    if (!position) return;
    
    const goals = prompt('Anzahl Tore (optional):', '0');
    
    try {
      await insert({
        name: name.trim(),
        team: team.trim(),
        position: position.trim().toUpperCase(),
        goals: parseInt(goals) || 0,
      });
      alert('Spieler erfolgreich hinzugefügt!');
    } catch (error) {
      alert('Fehler beim Hinzufügen des Spielers: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Neuen Spieler hinzufügen
        </h3>
        <p className="text-text-muted text-sm">
          Fügen Sie einen neuen Spieler zur Datenbank hinzu.
        </p>
      </div>

      <div className="modern-card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👤</div>
          <h4 className="text-lg font-medium text-text-primary mb-2">
            <i className="fas fa-user-plus mr-2"></i>
            Spieler hinzufügen
          </h4>
          <p className="text-text-muted mb-6">
            Klicken Sie auf den Button, um einen neuen Spieler zu erfassen.
          </p>
          
          <button 
            onClick={handleAddPlayer}
            className="btn-primary"
          >
            <i className="fas fa-plus mr-2"></i>
            Neuen Spieler erfassen
          </button>
        </div>
      </div>

      {/* Teams Reference */}
      <div className="mt-6 modern-card">
        <h4 className="font-semibold text-text-primary mb-3">Verfügbare Teams</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {TEAMS.map((team) => (
            <div key={team.value} className="p-3 bg-bg-secondary rounded-lg text-center">
              <span className="font-medium text-text-primary">{team.label}</span>
              <div className="text-xs text-text-muted mt-1">({team.value})</div>
            </div>
          ))}
        </div>
      </div>

      {/* Positions Reference */}
      <div className="mt-6 modern-card">
        <h4 className="font-semibold text-text-primary mb-3">Verfügbare Positionen</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {POSITIONS.map((position) => (
            <div key={position.value} className="p-3 bg-bg-secondary rounded-lg text-center">
              <span className="font-medium text-text-primary text-sm">{position.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 modern-card bg-green-50 border-green-200">
        <div className="flex items-start">
          <div className="text-green-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-green-800 mb-1">Hinweis</h4>
            <p className="text-green-700 text-sm">
              Nach dem Hinzufügen können Sie den Spieler in der Kader-Übersicht einsehen und verwalten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}