import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

const BAN_TYPES = [
  { value: "Gelb-Rote Karte", label: "Gelb-Rote Karte", duration: 1 },
  { value: "Rote Karte", label: "Rote Karte", duration: 2 },
  { value: "Verletzung", label: "Verletzung", duration: 3 }
];

export default function BansTab() {
  const [selectedType, setSelectedType] = useState('all');
  
  const { data: bans, loading: bansLoading, refetch: refetchBans } = useSupabaseQuery('bans', '*');
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  const { insert, update, remove } = useSupabaseMutation('bans');
  
  const loading = bansLoading || playersLoading;

  // Minimal CRUD functions without changing the design
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
      refetchBans();
    } catch (error) {
      alert('Fehler beim Hinzufügen der Sperre: ' + error.message);
    }
  };

  const handleReduceBan = async (ban) => {
    if (ban.anzahl_spiele <= 0) return;
    
    try {
      await update({
        anzahl_spiele: ban.anzahl_spiele - 1
      }, ban.id);
      refetchBans();
    } catch (error) {
      alert('Fehler beim Reduzieren der Sperre: ' + error.message);
    }
  };

  const handleDeleteBan = async (ban) => {
    const playerName = getPlayerName(ban.spieler_id);
    if (!confirm(`Sind Sie sicher, dass Sie die Sperre von ${playerName} löschen möchten?`)) return;
    
    try {
      await remove(ban.id);
      refetchBans();
    } catch (error) {
      alert('Fehler beim Löschen der Sperre: ' + error.message);
    }
  };

  const getPlayerName = (playerId) => {
    if (!players) return 'Unbekannt';
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unbekannt';
  };

  const getPlayerTeam = (playerId) => {
    if (!players) return 'Unbekannt';
    const player = players.find(p => p.id === playerId);
    return player?.team || 'Unbekannt';
  };

  const getBanTypeColor = (type) => {
    switch (type) {
      case 'Gelb-Rote Karte':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Rote Karte':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Verletzung':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBanIcon = (type) => {
    switch (type) {
      case 'Gelb-Rote Karte':
        return '🟨🟥';
      case 'Rote Karte':
        return '🟥';
      case 'Verletzung':
        return '🏥';
      default:
        return '⚠️';
    }
  };

  const filteredBans = bans?.filter(ban => {
    if (selectedType === 'all') return true;
    if (selectedType === 'active') return ban.anzahl_spiele > 0;
    if (selectedType === 'completed') return ban.anzahl_spiele === 0;
    return ban.art === selectedType;
  }) || [];

  const activeBans = bans?.filter(ban => ban.anzahl_spiele > 0) || [];
  const completedBans = bans?.filter(ban => ban.anzahl_spiele === 0) || [];

  if (loading) {
    return <LoadingSpinner message="Lade Sperren..." />;
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Sperren-Übersicht
        </h2>
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'Alle', count: bans?.length || 0 },
            { key: 'active', label: 'Aktiv', count: activeBans.length },
            { key: 'completed', label: 'Beendet', count: completedBans.length },
            ...BAN_TYPES.map(type => ({
              key: type.value,
              label: type.label,
              count: bans?.filter(ban => ban.art === type.value).length || 0
            }))
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedType(filter.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedType === filter.key
                  ? 'bg-primary-green text-white'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary border border-border-light'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-accent-red">
            {activeBans.length}
          </div>
          <div className="text-sm text-text-muted">Aktive Sperren</div>
        </div>
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-primary-green">
            {completedBans.length}
          </div>
          <div className="text-sm text-text-muted">Beendete Sperren</div>
        </div>
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-accent-orange">
            {bans?.length || 0}
          </div>
          <div className="text-sm text-text-muted">Gesamt Sperren</div>
        </div>
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-accent-blue">
            {BAN_TYPES.length}
          </div>
          <div className="text-sm text-text-muted">Sperr-Arten</div>
        </div>
      </div>

      {/* Bans List */}
      {filteredBans.length > 0 ? (
        <div className="space-y-4">
          {filteredBans.map((ban) => (
            <div key={ban.id} className="modern-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">
                    {getBanIcon(ban.art)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-text-primary">
                        {getPlayerName(ban.spieler_id)}
                      </h3>
                      <span className="text-sm text-text-muted">
                        ({getPlayerTeam(ban.spieler_id)})
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getBanTypeColor(ban.art)}`}>
                        {ban.art}
                      </span>
                      {ban.anzahl_spiele > 0 ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          {ban.anzahl_spiele} Spiel{ban.anzahl_spiele !== 1 ? 'e' : ''} verbleibend
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Beendet
                        </span>
                      )}
                    </div>

                    {ban.beschreibung && (
                      <p className="text-sm text-text-muted">
                        {ban.beschreibung}
                      </p>
                    )}
                    
                    {ban.datum && (
                      <p className="text-xs text-text-muted mt-2">
                        Erstellt: {new Date(ban.datum).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {ban.anzahl_spiele > 0 && (
                    <button
                      onClick={() => handleReduceBan(ban)}
                      className="text-text-muted hover:text-primary-green transition-colors p-1"
                      title="Sperre reduzieren"
                    >
                      <i className="fas fa-minus text-sm"></i>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteBan(ban)}
                    className="text-text-muted hover:text-accent-red transition-colors p-1"
                    title="Sperre löschen"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {selectedType === 'all' ? 'Keine Sperren gefunden' : `Keine ${selectedType === 'active' ? 'aktiven' : selectedType === 'completed' ? 'beendeten' : selectedType} Sperren`}
          </h3>
          <p className="text-text-muted">
            {selectedType === 'all' 
              ? 'Es wurden noch keine Sperren erstellt.'
              : 'Versuche einen anderen Filter oder erstelle neue Sperren.'
            }
          </p>
        </div>
      )}

      {/* Add Ban Button */}
      <div className="mt-6">
        <button 
          onClick={handleAddBan}
          className="w-full btn-primary"
        >
          <i className="fas fa-plus mr-2"></i>
          Neue Sperre hinzufügen
        </button>
      </div>
    </div>
  );
}