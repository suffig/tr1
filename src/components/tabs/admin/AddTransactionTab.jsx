import { useSupabaseMutation } from '../../../hooks/useSupabase';

const TRANSACTION_TYPES = [
  { value: 'Einnahme', label: 'Einnahme', icon: '📈' },
  { value: 'Ausgabe', label: 'Ausgabe', icon: '📉' },
];

const TEAMS = [
  { value: 'AEK', label: 'AEK Athen' },
  { value: 'Real', label: 'Real Madrid' },
];

export default function AddTransactionTab() {
  const { insert } = useSupabaseMutation('transactions');

  const handleAddTransaction = async () => {
    const team = prompt(`Team (${TEAMS.map(t => t.value).join(', ')}):`, 'AEK');
    if (!team) return;
    
    const art = prompt(`Art (${TRANSACTION_TYPES.map(t => t.value).join(', ')}):`, 'Einnahme');
    if (!art) return;
    
    const beschreibung = prompt('Beschreibung:');
    if (!beschreibung) return;
    
    const betrag = prompt('Betrag (in Euro):');
    if (!betrag || isNaN(betrag)) return;
    
    const datum = prompt('Datum (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!datum) return;
    
    try {
      await insert({
        team: team.trim(),
        art: art.trim(),
        beschreibung: beschreibung.trim(),
        betrag: parseFloat(betrag),
        datum: datum,
      });
      alert('Transaktion erfolgreich hinzugefügt!');
    } catch (error) {
      alert('Fehler beim Hinzufügen der Transaktion: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Neue Transaktion hinzufügen
        </h3>
        <p className="text-text-muted text-sm">
          Erfassen Sie eine neue finanzielle Transaktion.
        </p>
      </div>

      <div className="modern-card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💰</div>
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Transaktion hinzufügen
          </h4>
          <p className="text-text-muted mb-6">
            Klicken Sie auf den Button, um eine neue Transaktion zu erfassen.
          </p>
          
          <button 
            onClick={handleAddTransaction}
            className="btn-primary"
          >
            <i className="fas fa-plus mr-2"></i>
            Neue Transaktion erfassen
          </button>
        </div>
      </div>

      {/* Transaction Types Reference */}
      <div className="mt-6 modern-card">
        <h4 className="font-semibold text-text-primary mb-3">Transaktionsarten</h4>
        <div className="grid grid-cols-2 gap-2">
          {TRANSACTION_TYPES.map((type) => (
            <div key={type.value} className="p-3 bg-bg-secondary rounded-lg text-center">
              <div className="text-2xl mb-2">{type.icon}</div>
              <span className="font-medium text-text-primary">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Teams Reference */}
      <div className="mt-6 modern-card">
        <h4 className="font-semibold text-text-primary mb-3">Verfügbare Teams</h4>
        <div className="grid grid-cols-2 gap-2">
          {TEAMS.map((team) => (
            <div key={team.value} className="p-3 bg-bg-secondary rounded-lg text-center">
              <span className="font-medium text-text-primary">{team.label}</span>
              <div className="text-xs text-text-muted mt-1">({team.value})</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 modern-card bg-purple-50 border-purple-200">
        <div className="flex items-start">
          <div className="text-purple-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-purple-800 mb-1">Hinweis</h4>
            <p className="text-purple-700 text-sm">
              Nach dem Hinzufügen können Sie die Transaktion in der Finanzen-Übersicht einsehen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}