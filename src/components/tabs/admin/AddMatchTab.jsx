import { useState } from 'react';
import { useSupabaseQuery } from '../../../hooks/useSupabase';
import { MatchBusinessLogic } from '../../../utils/matchBusinessLogic';
import toast from 'react-hot-toast';

export default function AddMatchTab() {
  const { data: players } = useSupabaseQuery('players', '*');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    teama: 'AEK',
    teamb: 'Real',
    date: new Date().toISOString().split('T')[0],
    goalsa: 0,
    goalsb: 0,
    goalslista: [],
    goalslistb: [],
    yellowa: 0,
    reda: 0,
    yellowb: 0,
    redb: 0,
    prizeaek: 0,
    prizereal: 0,
    manofthematch: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate prize money when goals or cards change
      if (['goalsa', 'goalsb', 'yellowa', 'reda', 'yellowb', 'redb'].includes(field)) {
        const goalsa = parseInt(updated.goalsa) || 0;
        const goalsb = parseInt(updated.goalsb) || 0;
        const yellowa = parseInt(updated.yellowa) || 0;
        const reda = parseInt(updated.reda) || 0;
        const yellowb = parseInt(updated.yellowb) || 0;
        const redb = parseInt(updated.redb) || 0;
        
        // Use the same calculation logic as MatchBusinessLogic
        const { prizeaek, prizereal } = MatchBusinessLogic.calculatePrizeMoney(
          goalsa, goalsb, yellowa, reda, yellowb, redb
        );
        
        updated.prizeaek = prizeaek;
        updated.prizereal = prizereal;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate goal scorers don't exceed total goals
      const goalsaScorerCount = formData.goalslista.filter(s => s.trim()).length;
      const goalsbScorerCount = formData.goalslistb.filter(s => s.trim()).length;
      
      if (goalsaScorerCount > parseInt(formData.goalsa)) {
        throw new Error(`Die Anzahl der Torschützen für ${formData.teama} (${goalsaScorerCount}) darf nicht größer als die Gesamtanzahl der Tore (${formData.goalsa}) sein!`);
      }
      
      if (goalsbScorerCount > parseInt(formData.goalsb)) {
        throw new Error(`Die Anzahl der Torschützen für ${formData.teamb} (${goalsbScorerCount}) darf nicht größer als die Gesamtanzahl der Tore (${formData.goalsb}) sein!`);
      }

      // Use the comprehensive business logic
      const result = await MatchBusinessLogic.submitMatch({
        date: formData.date,
        teama: formData.teama.trim(),
        teamb: formData.teamb.trim(),
        goalsa: parseInt(formData.goalsa) || 0,
        goalsb: parseInt(formData.goalsb) || 0,
        goalslista: formData.goalslista.filter(s => s.trim()),
        goalslistb: formData.goalslistb.filter(s => s.trim()),
        yellowa: parseInt(formData.yellowa) || 0,
        reda: parseInt(formData.reda) || 0,
        yellowb: parseInt(formData.yellowb) || 0,
        redb: parseInt(formData.redb) || 0,
        manofthematch: formData.manofthematch || null
      });
      
      // Reset form and close modal
      setFormData({
        teama: 'AEK',
        teamb: 'Real',
        date: new Date().toISOString().split('T')[0],
        goalsa: 0,
        goalsb: 0,
        goalslista: [],
        goalslistb: [],
        yellowa: 0,
        reda: 0,
        yellowb: 0,
        redb: 0,
        prizeaek: 0,
        prizereal: 0,
        manofthematch: ''
      });
      setShowModal(false);
      
      // Show success message with comprehensive feedback
      toast.success(result.message);
    } catch (error) {
      console.error('Match submission error:', error);
      toast.error(error.message || 'Fehler beim Hinzufügen des Spiels');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.teama && formData.teamb && formData.date;

  // Helper functions for goal scorers
  const getTeamPlayers = (teamName) => {
    if (!players) return [];
    return players.filter(p => p.team === teamName);
  };

  const addGoalScorer = (team) => {
    const fieldName = team === 'AEK' ? 'goalslista' : 'goalslistb';
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], '']
    }));
  };

  const removeGoalScorer = (team, index) => {
    const fieldName = team === 'AEK' ? 'goalslista' : 'goalslistb';
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };

  const updateGoalScorer = (team, index, playerName) => {
    const fieldName = team === 'AEK' ? 'goalslista' : 'goalslistb';
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((scorer, i) => i === index ? playerName : scorer)
    }));
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
                  <select
                    value={formData.teama}
                    onChange={(e) => handleInputChange('teama', e.target.value)}
                    className="form-input"
                    required
                    disabled={loading}
                  >
                    <option value="AEK">AEK Athen</option>
                    <option value="Real">Real Madrid</option>
                  </select>
                </div>

                {/* Away Team */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Gastteam *
                  </label>
                  <select
                    value={formData.teamb}
                    onChange={(e) => handleInputChange('teamb', e.target.value)}
                    className="form-input"
                    required
                    disabled={loading}
                  >
                    <option value="Real">Real Madrid</option>
                    <option value="AEK">AEK Athen</option>
                  </select>
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

                {/* Goal Scorers */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-text-primary mb-3">⚽ Torschützen</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* AEK Scorers */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-blue-600 font-medium">AEK Athen</p>
                        <button
                          type="button"
                          onClick={() => addGoalScorer('AEK')}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                          disabled={loading}
                        >
                          + Torschütze
                        </button>
                      </div>
                      {formData.goalslista.map((scorer, index) => (
                        <div key={index} className="flex gap-2">
                          <select
                            value={scorer}
                            onChange={(e) => updateGoalScorer('AEK', index, e.target.value)}
                            className="form-input text-sm flex-1"
                            disabled={loading}
                          >
                            <option value="">Spieler wählen</option>
                            {getTeamPlayers('AEK').map((player) => (
                              <option key={player.id} value={player.name}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeGoalScorer('AEK', index)}
                            className="text-red-600 hover:text-red-800 p-1"
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {formData.goalslista.length === 0 && (
                        <p className="text-xs text-text-muted">Keine Torschützen hinzugefügt</p>
                      )}
                    </div>

                    {/* Real Scorers */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-red-600 font-medium">Real Madrid</p>
                        <button
                          type="button"
                          onClick={() => addGoalScorer('Real')}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                          disabled={loading}
                        >
                          + Torschütze
                        </button>
                      </div>
                      {formData.goalslistb.map((scorer, index) => (
                        <div key={index} className="flex gap-2">
                          <select
                            value={scorer}
                            onChange={(e) => updateGoalScorer('Real', index, e.target.value)}
                            className="form-input text-sm flex-1"
                            disabled={loading}
                          >
                            <option value="">Spieler wählen</option>
                            {getTeamPlayers('Real').map((player) => (
                              <option key={player.id} value={player.name}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeGoalScorer('Real', index)}
                            className="text-red-600 hover:text-red-800 p-1"
                            disabled={loading}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {formData.goalslistb.length === 0 && (
                        <p className="text-xs text-text-muted">Keine Torschützen hinzugefügt</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-text-primary mb-3">🟨🟥 Karten</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="text-xs text-blue-600 font-medium">Heimteam</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-text-muted mb-1">
                            🟨 Gelbe Karten
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.yellowa}
                            onChange={(e) => handleInputChange('yellowa', e.target.value)}
                            className="form-input"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">
                            🟥 Rote Karten
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.reda}
                            onChange={(e) => handleInputChange('reda', e.target.value)}
                            className="form-input"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-red-600 font-medium">Gastteam</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-text-muted mb-1">
                            🟨 Gelbe Karten
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.yellowb}
                            onChange={(e) => handleInputChange('yellowb', e.target.value)}
                            className="form-input"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">
                            🟥 Rote Karten
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.redb}
                            onChange={(e) => handleInputChange('redb', e.target.value)}
                            className="form-input"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prize Money */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-text-primary mb-3">💰 Preisgelder (automatisch berechnet)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Preisgeld AEK (€)
                      </label>
                      <input
                        type="number"
                        value={formData.prizeaek}
                        className="form-input bg-gray-100"
                        placeholder="Automatisch berechnet"
                        disabled
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Preisgeld Real (€)
                      </label>
                      <input
                        type="number"
                        value={formData.prizereal}
                        className="form-input bg-gray-100"
                        placeholder="Automatisch berechnet"
                        disabled
                        readOnly
                      />
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    Basierend auf Ergebnis und Karten: Gewinner 1M€ - (Verlierer-Tore × 50k€) - (Karten × 20k€/50k€)
                  </p>
                </div>

                {/* Player of the Match */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-text-primary mb-3">⭐ Spieler des Spiels</h4>
                  <select
                    value={formData.manofthematch}
                    onChange={(e) => handleInputChange('manofthematch', e.target.value)}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Keinen Spieler auswählen</option>
                    {players && players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.team} - {player.position})
                      </option>
                    ))}
                  </select>
                  {!players || players.length === 0 && (
                    <p className="text-xs text-text-muted mt-1">
                      Keine Spieler verfügbar. Bitte fügen Sie erst Spieler hinzu.
                    </p>
                  )}
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