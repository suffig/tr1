import { useSupabaseQuery, useSupabaseMutation } from '../../../hooks/useSupabase';

const BAN_TYPES = [
  { value: "Gelb-Rote Karte", label: "Gelb-Rote Karte", duration: 1 },
  { value: "Rote Karte", label: "Rote Karte", duration: 2 },
  { value: "Verletzung", label: "Verletzung", duration: 3 }
];

export default function AddBanTab() {
  const { data: players } = useSupabaseQuery('players', '*');
  const { insert } = useSupabaseMutation('bans');

  const handleAddBan = async () => {
    if (!players || players.length === 0) {
      alert('Keine Spieler gefunden. Bitte fügen Sie erst Spieler hinzu.');
      return;
    }

    const playerName = prompt('Spielername:');
    if (!playerName) return;
    
    const player = players.find(p => p.name.toLowerCase().includes(playerName.toLowerCase()));
    if (!player) {
      alert('Spieler nicht gefunden. Verfügbare Spieler: ' + players.map(p => p.name).join(', '));
      return;
    }
    
    const banType = prompt('Grund (Gelb-Rote Karte, Rote Karte, Verletzung):', 'Gelb-Rote Karte');
    if (!banType) return;
    
    const selectedBanType = BAN_TYPES.find(type => type.value === banType) || BAN_TYPES[0];
    
    try {
      await insert({
        spieler_id: player.id,
        art: selectedBanType.value,
        anzahl_spiele: selectedBanType.duration,
        beschreibung: '',
        datum: new Date().toISOString().split('T')[0]
      });
      alert('Sperre erfolgreich hinzugefügt!');
    } catch (error) {
      alert('Fehler beim Hinzufügen der Sperre: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Neue Sperre hinzufügen
        </h3>
        <p className="text-text-muted text-sm">
          Erstellen Sie eine neue Spielersperre in der Datenbank.
        </p>
      </div>

      <div className="modern-card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🚫</div>
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Sperre hinzufügen
          </h4>
          <p className="text-text-muted mb-6">
            Klicken Sie auf den Button, um eine neue Spielersperre zu erfassen.
          </p>
          
          <button 
            onClick={handleAddBan}
            className="btn-primary"
          >
            <i className="fas fa-plus mr-2"></i>
            Neue Sperre erfassen
          </button>
        </div>
      </div>

      {/* Available Ban Types */}
      <div className="mt-6 modern-card">
        <h4 className="font-semibold text-text-primary mb-3">Verfügbare Sperrarten</h4>
        <div className="space-y-2">
          {BAN_TYPES.map((banType) => (
            <div key={banType.value} className="flex justify-between items-center p-3 bg-bg-secondary rounded-lg">
              <span className="font-medium text-text-primary">{banType.label}</span>
              <span className="text-sm text-text-muted">{banType.duration} Spiel{banType.duration !== 1 ? 'e' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 modern-card bg-yellow-50 border-yellow-200">
        <div className="flex items-start">
          <div className="text-yellow-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Hinweis</h4>
            <p className="text-yellow-700 text-sm">
              Nach dem Hinzufügen können Sie die Sperre in der Sperren-Übersicht einsehen und verwalten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}