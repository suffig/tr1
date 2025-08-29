import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

export default function KaderTab() {
  const [openPanel, setOpenPanel] = useState('aek');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    team: 'AEK',
    position: 'ST',
    goals: 0
  });
  
  const { data: players, loading, error, refetch } = useSupabaseQuery('players', '*');
  const { data: finances } = useSupabaseQuery('finances', '*');
  const { insert, update, remove, loading: mutationLoading } = useSupabaseMutation('players');
  
  const POSITION_ORDER = {
    "TH": 0, "IV": 1, "LV": 2, "RV": 3, "ZDM": 4, "ZM": 5,
    "ZOM": 6, "LM": 7, "RM": 8, "LF": 9, "RF": 10, "ST": 11
  };

  const POSITIONS = ["TH", "IV", "LV", "RV", "ZDM", "ZM", "ZOM", "LM", "RM", "LF", "RF", "ST"];

  const resetForm = () => {
    setFormData({
      name: '',
      team: 'AEK',
      position: 'ST',
      goals: 0
    });
    setEditingPlayer(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPlayer) {
        await update(formData, editingPlayer.id);
        toast.success('Spieler erfolgreich aktualisiert!');
      } else {
        await insert(formData);
        toast.success('Spieler erfolgreich hinzugefügt!');
      }
      
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error(`Fehler beim ${editingPlayer ? 'Aktualisieren' : 'Hinzufügen'} des Spielers`);
    }
  };

  const handleEdit = (player) => {
    setFormData({
      name: player.name,
      team: player.team,
      position: player.position,
      goals: player.goals || 0
    });
    setEditingPlayer(player);
    setShowAddForm(true);
  };

  const handleDelete = async (playerId) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Spieler löschen möchten?')) {
      return;
    }

    try {
      await remove(playerId);
      toast.success('Spieler erfolgreich gelöscht!');
      refetch();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Fehler beim Löschen des Spielers');
    }
  };

  const handleAddPlayerToTeam = (teamName) => {
    setFormData({ ...formData, team: teamName });
    setShowAddForm(true);
  };

  const getPositionBadgeClass = (pos) => {
    if (pos === "TH") return "inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200";
    if (["IV", "LV", "RV", "ZDM"].includes(pos)) return "inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200";
    if (["ZM", "ZOM", "LM", "RM"].includes(pos)) return "inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200";
    if (["LF", "RF", "ST"].includes(pos)) return "inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200";
    return "inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200";
  };

  const getTeamPlayers = (teamName) => {
    if (!players) return [];
    return players
      .filter(p => p.team === teamName)
      .sort((a, b) => (POSITION_ORDER[a.position] || 99) - (POSITION_ORDER[b.position] || 99));
  };

  const getTeamBalance = (teamName) => {
    if (!finances) return 0;
    const teamFinance = finances.find(f => f.team === teamName);
    return teamFinance?.balance || 0;
  };

  const getTeamCardClass = (teamName) => {
    const baseClass = "modern-card";
    if (teamName === "AEK") return `${baseClass} border-l-4 border-blue-400`;
    if (teamName === "Real") return `${baseClass} border-l-4 border-purple-400`;
    if (teamName === "Ehemalige") return `${baseClass} border-l-4 border-slate-400`;
    return baseClass;
  };

  const getTeamColor = (teamName) => {
    if (teamName === "AEK") return "text-blue-600";
    if (teamName === "Real") return "text-purple-600";
    if (teamName === "Ehemalige") return "text-slate-600";
    return "text-gray-600";
  };

  const getTeamIcon = (teamName) => {
    if (teamName === "AEK") return "🔵";
    if (teamName === "Real") return "🟣";
    if (teamName === "Ehemalige") return "⚪";
    return "⚽";
  };

  if (loading) {
    return <LoadingSpinner message="Lade Kader..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-accent-red mb-4">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <p className="text-text-muted mb-4">Fehler beim Laden des Kaders</p>
        <button onClick={refetch} className="btn-primary">
          Erneut versuchen
        </button>
      </div>
    );
  }

  const aekPlayers = getTeamPlayers("AEK");
  const realPlayers = getTeamPlayers("Real");
  const ehemaligePlayers = getTeamPlayers("Ehemalige");

  const teams = [
    { 
      id: 'aek', 
      name: 'AEK', 
      displayName: 'AEK Athen', 
      players: aekPlayers,
      balance: getTeamBalance('AEK'),
      icon: '🔵'
    },
    { 
      id: 'real', 
      name: 'Real', 
      displayName: 'Real Madrid', 
      players: realPlayers,
      balance: getTeamBalance('Real'),
      icon: '🟣'
    },
    { 
      id: 'ehemalige', 
      name: 'Ehemalige', 
      displayName: 'Ehemalige', 
      players: ehemaligePlayers,
      balance: 0, // Ehemalige have no finances
      icon: '⚪'
    }
  ];

  return (
    <div className="p-4 pb-20">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Kader-Übersicht
          </h2>
          <p className="text-text-muted">
            {players?.length || 0} Spieler insgesamt
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
          disabled={mutationLoading}
        >
          <i className="fas fa-plus mr-2"></i>
          Neuer Spieler
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="modern-card mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {editingPlayer ? 'Spieler bearbeiten' : 'Neuen Spieler hinzufügen'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                placeholder="Spielername"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <option value="Ehemalige">Ehemalige</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Position
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="form-input"
                >
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tore
                </label>
                <input
                  type="number"
                  value={formData.goals}
                  onChange={(e) => setFormData({...formData, goals: parseInt(e.target.value) || 0})}
                  className="form-input"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={mutationLoading}
                className="btn-primary disabled:opacity-50"
              >
                {mutationLoading ? 'Speichert...' : (editingPlayer ? 'Aktualisieren' : 'Hinzufügen')}
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

      {/* Team Accordions */}
      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className={getTeamCardClass(team.name)}>
            {/* Team Header */}
            <button
              onClick={() => setOpenPanel(openPanel === team.id ? null : team.id)}
              className="w-full text-left p-4 focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{team.icon}</span>
                  <div>
                    <h3 className={`font-semibold text-lg ${getTeamColor(team.name)}`}>
                      {team.displayName}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {team.players.length} Spieler
                      {team.balance !== 0 && (
                        <span className="ml-2">
                          • Balance: €{team.balance.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-muted">
                    {team.players.length}
                  </span>
                  <i className={`fas fa-chevron-${openPanel === team.id ? 'up' : 'down'} transition-transform`}></i>
                </div>
              </div>
            </button>

            {/* Team Players */}
            {openPanel === team.id && (
              <div className="px-4 pb-4 border-t border-border-light mt-4 pt-4">
                {team.players.length > 0 ? (
                  <div className="grid gap-3">
                    {team.players.map((player) => (
                      <div key={player.id} className="bg-bg-tertiary rounded-lg p-3 hover:bg-bg-secondary transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-medium text-text-primary">
                                  {player.name}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={getPositionBadgeClass(player.position)}>
                                    {player.position}
                                  </span>
                                  {player.staerke && (
                                    <span className="text-xs text-text-muted">
                                      Stärke: {player.staerke}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(player)}
                              className="text-text-muted hover:text-primary-green transition-colors p-1"
                              title="Bearbeiten"
                              disabled={mutationLoading}
                            >
                              <i className="fas fa-edit text-sm"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(player.id)}
                              className="text-text-muted hover:text-accent-red transition-colors p-1"
                              title="Löschen"
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
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">{team.icon}</div>
                    <p className="text-text-muted">
                      Keine Spieler in {team.displayName}
                    </p>
                  </div>
                )}

                {/* Add Player Button */}
                <div className="mt-4 pt-4 border-t border-border-light">
                  <button 
                    onClick={() => handleAddPlayerToTeam(team.name)}
                    className="w-full btn-secondary text-sm py-2"
                    disabled={mutationLoading}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Spieler zu {team.displayName} hinzufügen
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-primary-green">
            {players?.length || 0}
          </div>
          <div className="text-sm text-text-muted">Gesamt Spieler</div>
        </div>
        <div className="modern-card text-center">
          <div className="text-2xl font-bold text-accent-orange">
            {POSITIONS.length}
          </div>
          <div className="text-sm text-text-muted">Positionen</div>
        </div>
      </div>
    </div>
  );
}