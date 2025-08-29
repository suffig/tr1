import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

export default function BansTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBan, setEditingBan] = useState(null);
  const [formData, setFormData] = useState({
    player_name: '',
    team: 'AEK',
    matches_remaining: 1,
    reason: ''
  });

  const { data: bans, loading, error, refetch } = useSupabaseQuery(
    'bans',
    '*',
    { order: { column: 'created_at', ascending: false } }
  );

  const { insert, update, remove, loading: mutationLoading } = useSupabaseMutation('bans');

  const resetForm = () => {
    setFormData({
      player_name: '',
      team: 'AEK',
      matches_remaining: 1,
      reason: ''
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
        await insert(formData);
        toast.success('Sperre erfolgreich hinzugefügt!');
      }
      
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error saving ban:', error);
      toast.error(`Fehler beim ${editingBan ? 'Aktualisieren' : 'Hinzufügen'} der Sperre`);
    }
  };

  const handleEdit = (ban) => {
    setFormData({
      player_name: ban.player_name,
      team: ban.team,
      matches_remaining: ban.matches_remaining,
      reason: ban.reason || ''
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
      refetch();
    } catch (error) {
      console.error('Error deleting ban:', error);
      toast.error('Fehler beim Löschen der Sperre');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Lade Sperren..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-accent-red mb-4">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <p className="text-text-muted mb-4">Fehler beim Laden der Sperren</p>
        <button onClick={refetch} className="btn-primary">
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Sperren
          </h2>
          <p className="text-text-muted">
            {bans?.length || 0} aktive Sperren
          </p>
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
                Spielername
              </label>
              <input
                type="text"
                value={formData.player_name}
                onChange={(e) => setFormData({...formData, player_name: e.target.value})}
                className="form-input"
                placeholder="Name des gesperrten Spielers"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Team
                </label>
                <select
                  value={formData.team}
                  onChange={(e) => setFormData({...formData, team: e.target.value})}
                  className="form-input"
                >
                  <option value="AEK">AEK</option>
                  <option value="Real">Real</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Verbleibende Spiele
                </label>
                <input
                  type="number"
                  value={formData.matches_remaining}
                  onChange={(e) => setFormData({...formData, matches_remaining: parseInt(e.target.value) || 1})}
                  className="form-input"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Grund der Sperre
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="form-input"
                placeholder="z.B. Gelb-Rot, Unsportlichkeit, etc."
                required
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

      {bans && bans.length > 0 ? (
        <div className="space-y-4">
          {bans.map((ban) => (
            <div key={ban.id} className="modern-card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">
                    {ban.player_name}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {ban.team} • {ban.reason}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    ban.matches_remaining > 2 ? 'text-accent-red' : 
                    ban.matches_remaining > 1 ? 'text-accent-orange' : 'text-primary-green'
                  }`}>
                    {ban.matches_remaining} Spiel{ban.matches_remaining !== 1 ? 'e' : ''}
                  </div>
                  <p className="text-xs text-text-muted">
                    verbleibend
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => handleEdit(ban)}
                  className="text-primary-blue hover:text-primary-blue-dark text-sm font-medium"
                  disabled={mutationLoading}
                >
                  <i className="fas fa-edit mr-1"></i>
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(ban.id)}
                  className="text-accent-red hover:text-red-700 text-sm font-medium"
                  disabled={mutationLoading}
                >
                  <i className="fas fa-trash mr-1"></i>
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-text-muted mb-4">
            <i className="fas fa-ban text-4xl opacity-50"></i>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Keine Sperren gefunden
          </h3>
          <p className="text-text-muted mb-4">
            Aktuell sind keine Spieler gesperrt.
          </p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Erste Sperre hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}