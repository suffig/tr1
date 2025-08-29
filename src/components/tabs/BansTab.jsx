import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

const BAN_TYPES = [
  { value: "Gelb-Rote Karte", label: "Gelb-Rote Karte", duration: 1 },
  { value: "Rote Karte", label: "Rote Karte", duration: 2 },
  { value: "Verletzung", label: "Verletzung", duration: 3 }
];

export default function BansTab() {
  const [selectedType, setSelectedType] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBan, setEditingBan] = useState(null);
  const [formData, setFormData] = useState({
    spieler_id: '',
    art: 'Gelb-Rote Karte',
    anzahl_spiele: 1,
    beschreibung: ''
  });
  
  const { data: bans, loading: bansLoading, refetch: refetchBans } = useSupabaseQuery('bans', '*');
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  const { insert, update, remove, loading: mutationLoading } = useSupabaseMutation('bans');
  
  const loading = bansLoading || playersLoading;

  const resetForm = () => {
    setFormData({
      spieler_id: '',
      art: 'Gelb-Rote Karte',
      anzahl_spiele: 1,
      beschreibung: ''
    });
    setEditingBan(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingBan) {
        await update(formData, editingBan.id);
        toast.success('Sperre erfolgreich aktualisiert!');
      } else {
        await insert({ 
          ...formData, 
          datum: new Date().toISOString(),
          spieler_id: parseInt(formData.spieler_id)
        });
        toast.success('Sperre erfolgreich hinzugefügt!');
      }
      
      resetForm();
      refetchBans();
    } catch (error) {
      console.error('Error saving ban:', error);
      toast.error(`Fehler beim ${editingBan ? 'Aktualisieren' : 'Hinzufügen'} der Sperre`);
    }
  };

  const handleEdit = (ban) => {
    setFormData({
      spieler_id: ban.spieler_id.toString(),
      art: ban.art,
      anzahl_spiele: ban.anzahl_spiele,
      beschreibung: ban.beschreibung || ''
    });
    setEditingBan(ban);
    setShowAddForm(true);
  };

  const handleDelete = async (banId) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Sperre löschen möchten?')) {
      return;
    }

    try {
      await remove(banId);
      toast.success('Sperre erfolgreich gelöscht!');
      refetchBans();
    } catch (error) {
      console.error('Error deleting ban:', error);
      toast.error('Fehler beim Löschen der Sperre');
    }
  };

  const handleReduceBan = async (ban) => {
    if (ban.anzahl_spiele <= 0) return;
    
    try {
      await update({ anzahl_spiele: ban.anzahl_spiele - 1 }, ban.id);
      toast.success('Sperre um ein Spiel reduziert!');
      refetchBans();
    } catch (error) {
      console.error('Error reducing ban:', error);
      toast.error('Fehler beim Reduzieren der Sperre');
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Sperren-Übersicht
          </h2>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
          disabled={mutationLoading}
        >
          <i className="fas fa-plus mr-2"></i>
          Neue Sperre
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="modern-card mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {editingBan ? 'Sperre bearbeiten' : 'Neue Sperre hinzufügen'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Spieler
              </label>
              <select
                value={formData.spieler_id}
                onChange={(e) => setFormData({...formData, spieler_id: e.target.value})}
                className="form-input"
                required
              >
                <option value="">Spieler auswählen</option>
                {players?.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Art der Sperre
                </label>
                <select
                  value={formData.art}
                  onChange={(e) => {
                    const banType = BAN_TYPES.find(type => type.value === e.target.value);
                    setFormData({
                      ...formData, 
                      art: e.target.value,
                      anzahl_spiele: banType?.duration || 1
                    });
                  }}
                  className="form-input"
                >
                  {BAN_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Anzahl Spiele
                </label>
                <input
                  type="number"
                  value={formData.anzahl_spiele}
                  onChange={(e) => setFormData({...formData, anzahl_spiele: parseInt(e.target.value) || 1})}
                  className="form-input"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Beschreibung (optional)
              </label>
              <textarea
                value={formData.beschreibung}
                onChange={(e) => setFormData({...formData, beschreibung: e.target.value})}
                className="form-input"
                rows="3"
                placeholder="Zusätzliche Details zur Sperre..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={mutationLoading}
                className="btn-primary disabled:opacity-50"
              >
                {mutationLoading ? 'Speichert...' : (editingBan ? 'Aktualisieren' : 'Hinzufügen')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}
        
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
                      disabled={mutationLoading}
                    >
                      <i className="fas fa-minus text-sm"></i>
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(ban)}
                    className="text-text-muted hover:text-primary-blue transition-colors p-1"
                    title="Sperre bearbeiten"
                    disabled={mutationLoading}
                  >
                    <i className="fas fa-edit text-sm"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(ban.id)}
                    className="text-text-muted hover:text-accent-red transition-colors p-1"
                    title="Sperre löschen"
                    disabled={mutationLoading}
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
      {!showAddForm && (
        <div className="mt-6">
          <button 
            onClick={() => setShowAddForm(true)} 
            className="w-full btn-primary"
            disabled={mutationLoading}
          >
            <i className="fas fa-plus mr-2"></i>
            Neue Sperre hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}