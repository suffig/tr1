import { useState } from 'react';
import { useSupabaseMutation } from '../../../hooks/useSupabase';

export default function AddMatchTab() {
  const { insert } = useSupabaseMutation('matches');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    teama: '',
    teamb: '',
    date: new Date().toISOString().split('T')[0],
    goalsa: 0,
    goalsb: 0
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await insert({
        date: formData.date,
        teama: formData.teama.trim(),
        teamb: formData.teamb.trim(),
        goalsa: parseInt(formData.goalsa) || 0,
        goalsb: parseInt(formData.goalsb) || 0,
        goalslista: [],
        goalslistb: [],
        yellowa: 0,
        reda: 0,
        yellowb: 0,
        redb: 0,
        manofthematch: null,
        prizeaek: 0,
        prizereal: 0
      });
      
      // Reset form and close modal
      setFormData({
        teama: '',
        teamb: '',
        date: new Date().toISOString().split('T')[0],
        goalsa: 0,
        goalsb: 0
      });
      setShowModal(false);
      
      // Show success message
      alert('Spiel erfolgreich hinzugefügt!');
    } catch (error) {
      alert('Fehler beim Hinzufügen des Spiels: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.teama && formData.teamb && formData.date;

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
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <i className="fas fa-plus mr-2"></i>
            Neues Spiel erfassen
          </button>
        </div>
      </div>

      {/* Match Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-text-primary">Neues Spiel</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-muted hover:text-text-primary text-2xl"
                  disabled={loading}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Home Team */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Heimteam *
                  </label>
                  <input
                    type="text"
                    value={formData.teama}
                    onChange={(e) => handleInputChange('teama', e.target.value)}
                    className="form-input"
                    placeholder="z.B. AEK Athen"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Away Team */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Gastteam *
                  </label>
                  <input
                    type="text"
                    value={formData.teamb}
                    onChange={(e) => handleInputChange('teamb', e.target.value)}
                    className="form-input"
                    placeholder="z.B. Real Madrid"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Datum *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="form-input"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Goals */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Tore Heimteam
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.goalsa}
                      onChange={(e) => handleInputChange('goalsa', e.target.value)}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Tore Gastteam
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.goalsb}
                      onChange={(e) => handleInputChange('goalsb', e.target.value)}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-border-light rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors"
                    disabled={loading}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="spinner w-4 h-4 mr-2"></div>
                        Speichern...
                      </div>
                    ) : (
                      'Speichern'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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