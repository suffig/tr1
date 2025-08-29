import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import { ErrorHandler } from '../../utils/errorHandling';
import toast from 'react-hot-toast';

export default function MatchesTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    datum: '',
    team1: 'AEK',
    team2: 'Real',
    tore1: 0,
    tore2: 0,
    status: 'finished',
    beschreibung: ''
  });

  const { data: matches, loading, error, refetch } = useSupabaseQuery(
    'matches',
    '*',
    { order: { column: 'datum', ascending: false }, limit: 50 }
  );

  const { insert, update, remove, loading: mutationLoading } = useSupabaseMutation('matches');

  const resetForm = () => {
    setFormData({
      datum: '',
      team1: 'AEK',
      team2: 'Real',
      tore1: 0,
      tore2: 0,
      status: 'finished',
      beschreibung: ''
    });
    setEditingMatch(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingMatch) {
        await update(formData, editingMatch.id);
        toast.success('Spiel erfolgreich aktualisiert!');
      } else {
        await insert(formData);
        toast.success('Spiel erfolgreich hinzugefügt!');
      }
      
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error saving match:', error);
      toast.error(`Fehler beim ${editingMatch ? 'Aktualisieren' : 'Hinzufügen'} des Spiels`);
    }
  };

  const handleEdit = (match) => {
    setFormData({
      datum: match.datum,
      team1: match.team1,
      team2: match.team2,
      tore1: match.tore1,
      tore2: match.tore2,
      status: match.status || 'finished',
      beschreibung: match.beschreibung || ''
    });
    setEditingMatch(match);
    setShowAddForm(true);
  };

  const handleDelete = async (matchId) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Spiel löschen möchten?')) {
      return;
    }

    try {
      await remove(matchId);
      toast.success('Spiel erfolgreich gelöscht!');
      refetch();
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Fehler beim Löschen des Spiels');
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Spiele
          </h2>
          <p className="text-text-muted">
            {matches?.length || 0} Spiele gefunden
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
          disabled={mutationLoading}
        >
          <i className="fas fa-plus mr-2"></i>
          Neues Spiel
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="modern-card mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {editingMatch ? 'Spiel bearbeiten' : 'Neues Spiel hinzufügen'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={formData.datum}
                  onChange={(e) => setFormData({...formData, datum: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="form-input"
                >
                  <option value="finished">Beendet</option>
                  <option value="running">Laufend</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Team 1
                </label>
                <select
                  value={formData.team1}
                  onChange={(e) => setFormData({...formData, team1: e.target.value})}
                  className="form-input"
                >
                  <option value="AEK">AEK</option>
                  <option value="Real">Real</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tore Team 1
                </label>
                <input
                  type="number"
                  value={formData.tore1}
                  onChange={(e) => setFormData({...formData, tore1: parseInt(e.target.value) || 0})}
                  className="form-input"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Team 2
                </label>
                <select
                  value={formData.team2}
                  onChange={(e) => setFormData({...formData, team2: e.target.value})}
                  className="form-input"
                >
                  <option value="AEK">AEK</option>
                  <option value="Real">Real</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tore Team 2
                </label>
                <input
                  type="number"
                  value={formData.tore2}
                  onChange={(e) => setFormData({...formData, tore2: parseInt(e.target.value) || 0})}
                  className="form-input"
                  min="0"
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
                placeholder="Zusätzliche Informationen zum Spiel..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={mutationLoading}
                className="btn-primary disabled:opacity-50"
              >
                {mutationLoading ? 'Speichert...' : (editingMatch ? 'Aktualisieren' : 'Hinzufügen')}
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
                <p className="text-sm text-text-muted border-t pt-3 mt-3 mb-3">
                  {match.beschreibung}
                </p>
              )}
              
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => handleEdit(match)}
                  className="text-primary-blue hover:text-primary-blue-dark text-sm font-medium"
                  disabled={mutationLoading}
                >
                  <i className="fas fa-edit mr-1"></i>
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(match.id)}
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
            <i className="fas fa-futbol text-4xl opacity-50"></i>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Keine Spiele gefunden
          </h3>
          <p className="text-text-muted mb-4">
            Es wurden noch keine Spiele hinzugefügt.
          </p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Erstes Spiel hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}