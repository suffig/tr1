import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import ExportImportManager from '../ExportImportManager';
import FormationVisualizerModal from '../FormationVisualizerModal';
import { POSITIONS, TEAMS } from '../../utils/errorHandling';
import toast from 'react-hot-toast';

export default function KaderTab() {
  const [openPanel, setOpenPanel] = useState(null);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showFormationVisualizer, setShowFormationVisualizer] = useState(false);
  
  const { data: players, loading, error, refetch } = useSupabaseQuery('players', '*');
  const { insert, update, remove } = useSupabaseMutation('players');
  
  const POSITION_ORDER = {
    "TH": 0, "IV": 1, "LV": 2, "RV": 3, "ZDM": 4, "ZM": 5,
    "ZOM": 6, "LM": 7, "RM": 8, "LF": 9, "RF": 10, "ST": 11
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

  const getTeamSquadValue = (teamName) => {
    if (!players) return 0;
    return players
      .filter(p => p.team === teamName)
      .reduce((sum, p) => sum + (p.value || 0), 0);
  };

  const formatCurrencyInMillions = (amount) => {
    // Value is already in millions, just format it
    return `${(amount || 0).toFixed(1)}M €`;
  };

  const getTeamCardClass = (teamName) => {
    const baseClass = "modern-card";
    if (teamName === "AEK") return `${baseClass} border-l-4 border-blue-400`;
    if (teamName === "Real") return `${baseClass} border-l-4 border-red-400`;
    if (teamName === "Ehemalige") return `${baseClass} border-l-4 border-slate-400`;
    return baseClass;
  };

  // Team analysis functions
  const generatePlayerReport = () => {
    if (!players || players.length === 0) {
      alert('Keine Spieler für Report verfügbar');
      return;
    }
    
    const report = players.map(p => 
      `${p.name} (${p.team}): ${p.goals || 0} Tore, ${p.position || 'Unbekannt'}, Wert: ${formatCurrencyInMillions(p.value || 0)}`
    ).join('\n');
    
    alert(`📊 Spieler-Report:\n\n${report}`);
  };

  const balanceTeams = () => {
    const aekCount = getTeamPlayers("AEK").length;
    const realCount = getTeamPlayers("Real").length;
    const difference = Math.abs(aekCount - realCount);
    
    if (difference <= 1) {
      alert('✅ Teams sind bereits ausgeglichen!');
    } else {
      const needMore = aekCount > realCount ? 'Real Madrid' : 'AEK Athen';
      alert(`⚖️ Team-Balance:\n${needMore} benötigt ${difference} weitere Spieler für ausgeglichene Teams.`);
    }
  };

  const suggestTransfers = () => {
    if (!players || players.length < 4) {
      alert('🔄 Nicht genügend Spieler für Transfer-Analyse');
      return;
    }
    
    const aekPlayers = getTeamPlayers("AEK");
    const realPlayers = getTeamPlayers("Real");
    const suggestions = [];
    
    // Simple transfer suggestions based on team imbalance
    if (aekPlayers.length > realPlayers.length + 2) {
      const leastValuable = aekPlayers.sort((a, b) => (a.value || 0) - (b.value || 0))[0];
      suggestions.push(`🔄 ${leastValuable.name} von AEK zu Real transferieren`);
    } else if (realPlayers.length > aekPlayers.length + 2) {
      const leastValuable = realPlayers.sort((a, b) => (a.value || 0) - (b.value || 0))[0];
      suggestions.push(`🔄 ${leastValuable.name} von Real zu AEK transferieren`);
    }
    
    if (suggestions.length === 0) {
      suggestions.push('✅ Teams sind gut ausbalanciert - keine Transfers nötig');
    }
    
    alert(`🔄 Transfer-Empfehlungen:\n\n${suggestions.join('\n')}`);
  };

  const getTeamColor = (teamName) => {
    if (teamName === "AEK") return "text-blue-600";
    if (teamName === "Real") return "text-red-600";
    if (teamName === "Ehemalige") return "text-slate-600";
    return "text-gray-600";
  };

  const getTeamIcon = (teamName) => {
    if (teamName === "AEK") return "🔵";
    if (teamName === "Real") return "🔴";
    if (teamName === "Ehemalige") return "⚪";
    return "⚽";
  };

  // Minimal CRUD functions without changing the design
  const handleEditPlayer = async (player) => {
    const newName = prompt('Spielername:', player.name);
    if (!newName || newName === player.name) return;
    
    try {
      await update({ name: newName }, player.id);
      refetch();
    } catch (error) {
      alert('Fehler beim Aktualisieren des Spielers: ' + error.message);
    }
  };

  const handleDeletePlayer = async (player) => {
    if (!confirm(`Sind Sie sicher, dass Sie ${player.name} löschen möchten?`)) return;
    
    try {
      await remove(player.id);
      refetch();
    } catch (error) {
      alert('Fehler beim Löschen des Spielers: ' + error.message);
    }
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
      squadValue: getTeamSquadValue('AEK'),
      icon: '🔵'
    },
    { 
      id: 'real', 
      name: 'Real', 
      displayName: 'Real Madrid', 
      players: realPlayers,
      squadValue: getTeamSquadValue('Real'),
      icon: '🔴'
    },
    { 
      id: 'ehemalige', 
      name: 'Ehemalige', 
      displayName: 'Ehemalige', 
      players: ehemaligePlayers,
      squadValue: getTeamSquadValue('Ehemalige'),
      icon: '⚪'
    }
  ];

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Kader-Übersicht
        </h2>
        <p className="text-text-muted">
          {players?.length || 0} Spieler insgesamt
        </p>
      </div>

      {/* Enhanced Quick Actions Panel */}
      <div className="modern-card mb-6">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <span className="mr-2">⚡</span>
          Kader-Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Existing Actions */}
          <button
            onClick={generatePlayerReport}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <span>📊</span>
            <span>Spieler-Report</span>
          </button>
          <button
            onClick={balanceTeams}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <span>⚖️</span>
            <span>Teams ausgleichen</span>
          </button>
          <button
            onClick={suggestTransfers}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <span>🔄</span>
            <span>Transfer-Tipps</span>
          </button>
          
          {/* New Enhanced Features */}
          <button
            onClick={() => setShowFormationVisualizer(true)}
            className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <span>⚽</span>
            <span>Formation Planner</span>
          </button>
          <button
            onClick={() => setShowExportImport(true)}
            className="flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            <span>📦</span>
            <span>Export/Import</span>
          </button>
          <button
            onClick={() => {
              const totalValue = (getTeamSquadValue('AEK') + getTeamSquadValue('Real') + getTeamSquadValue('Ehemalige'));
              const avgValue = players?.length ? totalValue / players.length : 0;
              toast.success(
                `📈 Kader-Analyse:\n\n` +
                `Gesamtwert: ${formatCurrencyInMillions(totalValue)}\n` +
                `Durchschnitt: ${formatCurrencyInMillions(avgValue)}\n` +
                `Spieler gesamt: ${players?.length || 0}`,
                { duration: 5000 }
              );
            }}
            className="flex items-center justify-center space-x-2 bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors text-sm"
          >
            <span>📈</span>
            <span>Kader-Analyse</span>
          </button>
        </div>
      </div>

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
                      {team.squadValue > 0 && (
                        <span className="ml-2">
                          • Kaderwert: {formatCurrencyInMillions(team.squadValue)}
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
                                  {player.value && (
                                    <span className="text-xs text-primary-green font-medium">
                                      {formatCurrencyInMillions(player.value)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditPlayer(player)}
                              className="text-text-muted hover:text-primary-green transition-colors p-1"
                              title="Bearbeiten"
                            >
                              <i className="fas fa-edit text-sm"></i>
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(player)}
                              className="text-text-muted hover:text-accent-red transition-colors p-1"
                              title="Löschen"
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

      {/* New Feature Modals */}
      {showExportImport && (
        <ExportImportManager onClose={() => setShowExportImport(false)} />
      )}
      
      {showFormationVisualizer && (
        <FormationVisualizerModal
          players={players || []}
          onClose={() => setShowFormationVisualizer(false)}
        />
      )}
    </div>
  );
}