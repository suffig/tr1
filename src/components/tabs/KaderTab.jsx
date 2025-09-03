import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import ExportImportManager from '../ExportImportManager';
import FormationVisualizerModal from '../FormationVisualizerModal';
import PlayerDetailModal from '../PlayerDetailModal';
import { POSITIONS } from '../../utils/errorHandling';
import toast from 'react-hot-toast';

export default function KaderTab({ onNavigate }) { // eslint-disable-line no-unused-vars
  const [openPanel, setOpenPanel] = useState(null);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showFormationVisualizer, setShowFormationVisualizer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerDetail, setShowPlayerDetail] = useState(false);
  
  const { data: players, loading, error, refetch } = useSupabaseQuery('players', '*');
  const { update } = useSupabaseMutation('players');
  
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
    return (players || [])
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

  const suggestTransfers = () => {
    if (!players || players.length < 4) {
      toast.error('🔄 Nicht genügend Spieler für Transfer-Analyse');
      return;
    }
    
    const aekPlayers = getTeamPlayers("AEK");
    const realPlayers = getTeamPlayers("Real");
    const suggestions = [];
    
    // Analyze current team compositions for Transfermarkt suggestions
    const currentPositions = [...aekPlayers, ...realPlayers].reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, {});

    // Simulate realistic Transfermarkt.de player suggestions
    const transfermarktSuggestions = [
      { name: 'Pedri González', position: 'ZOM', age: 21, marketValue: 80.0, eafc25: 85, club: 'FC Barcelona', nationality: 'ESP' },
      { name: 'Jamal Musiala', position: 'LF', age: 21, marketValue: 100.0, eafc25: 84, club: 'Bayern München', nationality: 'GER' },
      { name: 'Eduardo Camavinga', position: 'ZDM', age: 22, marketValue: 90.0, eafc25: 83, club: 'Real Madrid', nationality: 'FRA' },
      { name: 'Florian Wirtz', position: 'ZOM', age: 21, marketValue: 85.0, eafc25: 82, club: 'Bayer Leverkusen', nationality: 'GER' },
      { name: 'Arda Güler', position: 'RV', age: 19, marketValue: 25.0, eafc25: 77, club: 'Real Madrid', nationality: 'TUR' },
      { name: 'Jude Bellingham', position: 'ZM', age: 21, marketValue: 120.0, eafc25: 86, club: 'Real Madrid', nationality: 'ENG' },
      { name: 'Gavi', position: 'ZM', age: 20, marketValue: 60.0, eafc25: 81, club: 'FC Barcelona', nationality: 'ESP' },
      { name: 'Warren Zaïre-Emery', position: 'ZM', age: 18, marketValue: 40.0, eafc25: 78, club: 'PSG', nationality: 'FRA' }
    ];

    // Determine position needs
    const positionNeeds = [];
    const idealMinimum = { 'TH': 1, 'IV': 2, 'ZM': 2, 'ST': 2 };
    Object.entries(idealMinimum).forEach(([pos, min]) => {
      if ((currentPositions[pos] || 0) < min) {
        positionNeeds.push(pos);
      }
    });

    // If no specific needs, suggest based on team balance
    if (positionNeeds.length === 0) {
      if (aekPlayers.length > realPlayers.length + 1) positionNeeds.push('ZM', 'ST');
      else if (realPlayers.length > aekPlayers.length + 1) positionNeeds.push('ZM', 'IV');
      else positionNeeds.push('ZOM', 'LF'); // General offensive improvements
    }

    // Get relevant suggestions
    const relevantSuggestions = transfermarktSuggestions
      .filter(player => positionNeeds.includes(player.position) || positionNeeds.length === 0)
      .slice(0, 3);

    // Internal transfer suggestions
    if (aekPlayers.length > realPlayers.length + 2) {
      const leastValuable = aekPlayers.sort((a, b) => (a.value || 0) - (b.value || 0))[0];
      suggestions.push(`🔄 Interner Transfer: ${leastValuable.name} von AEK zu Real`);
    } else if (realPlayers.length > aekPlayers.length + 2) {
      const leastValuable = realPlayers.sort((a, b) => (a.value || 0) - (b.value || 0))[0];
      suggestions.push(`🔄 Interner Transfer: ${leastValuable.name} von Real zu AEK`);
    }

    // Transfermarkt.de suggestions
    suggestions.push('🌐 TRANSFERMARKT.DE EMPFEHLUNGEN:');
    relevantSuggestions.forEach((player, index) => {
      suggestions.push(
        `${index + 1}. ${player.name} (${player.age}J) - ${player.position}\n` +
        `   💰 ${player.marketValue}M € | 🎮 EA FC 25: ${player.eafc25}\n` +
        `   🏆 ${player.club} (${player.nationality})`
      );
    });

    if (positionNeeds.length > 0) {
      suggestions.push(`\n🎯 Positions-Bedarf: ${positionNeeds.join(', ')}`);
    }

    const avgValue = players.reduce((sum, p) => sum + (p.value || 0), 0) / players.length;
    suggestions.push(`\n💡 Empfohlenes Budget: ~${(avgValue * 1.5).toFixed(0)}M € pro Transfer`);
    
    if (suggestions.length === 1) {
      suggestions.push('🤖 Teams sind optimal ausbalanciert!');
    }
    
    toast.success(
      `🤖 KI Transfer-Empfehlungen:\n\n${suggestions.join('\n')}`,
      { duration: 8000 }
    );
  };

  const getTeamColor = (teamName) => {
    if (teamName === "AEK") return "text-blue-600";
    if (teamName === "Real") return "text-red-600";
    if (teamName === "Ehemalige") return "text-slate-600";
    return "text-gray-600";
  };

  // Minimal CRUD functions without changing the design
  const handleEditPlayer = async (player) => {
    setEditingPlayer(player);
  };
  
  const handleSavePlayer = async (playerData) => {
    try {
      await update(playerData, editingPlayer.id);
      toast.success(`Spieler ${playerData.name} erfolgreich aktualisiert`);
      setEditingPlayer(null);
      refetch();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Spielers: ' + error.message);
    }
  };

  // FIFA functionality
  const handleShowPlayerDetail = (player) => {
    setSelectedPlayer(player);
    setShowPlayerDetail(true);
  };

  const handleClosePlayerDetail = () => {
    setShowPlayerDetail(false);
    setSelectedPlayer(null);
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
            onClick={suggestTransfers}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <span>🤖</span>
            <span>KI Transfer-Tipps</span>
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
                      <div key={player.id} className="bg-bg-tertiary rounded-lg p-3 hover:bg-bg-secondary transition-colors cursor-pointer relative group"
                           onClick={() => handleShowPlayerDetail(player)}>
                        {/* FIFA Indicator */}
                        <div className="absolute top-2 right-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          🎮 FIFA
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-medium text-text-primary group-hover:text-blue-400 transition-colors">
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
                                <div className="text-xs text-blue-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <i className="fas fa-info-circle mr-1"></i>
                                  Click for FIFA statistics
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowPlayerDetail(player);
                              }}
                              className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-blue-400/10"
                              title="FIFA Statistics"
                            >
                              <i className="fas fa-chart-bar text-sm"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPlayer(player);
                              }}
                              className="text-text-muted hover:text-primary-green transition-colors p-1"
                              title="Bearbeiten"
                            >
                              <i className="fas fa-edit text-sm"></i>
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
      
      {/* Player Detail Modal with FIFA Stats */}
      {showPlayerDetail && selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isOpen={showPlayerDetail}
          onClose={handleClosePlayerDetail}
        />
      )}
      
      {/* Player Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Spieler bearbeiten</h3>
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <PlayerForm
                player={editingPlayer}
                onSave={handleSavePlayer}
                onCancel={() => setEditingPlayer(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Player form component for editing
function PlayerForm({ player, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: player.name || '',
    position: player.position || '',
    value: player.value || 0,
    team: player.team || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.position || !formData.team) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          placeholder="Spielername"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Position *
        </label>
        <select
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          required
        >
          <option value="">Position wählen</option>
          {POSITIONS.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Team *
        </label>
        <select
          value={formData.team}
          onChange={(e) => setFormData({ ...formData, team: e.target.value })}
          className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          required
        >
          <option value="">Team wählen</option>
          <option value="AEK">AEK Athen</option>
          <option value="Real">Real Madrid</option>
          <option value="Ehemalige">Ehemalige</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Marktwert (in Millionen €)
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
          onFocus={(e) => e.target.select()}
          className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          placeholder="0.0"
        />
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary-green text-white py-2 px-4 rounded-lg hover:bg-primary-green/90 transition-colors"
        >
          Speichern
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-bg-secondary text-text-muted py-2 px-4 rounded-lg hover:bg-bg-tertiary transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}