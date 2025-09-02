import { useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import { BAN_TYPES, getBanTypeColor, getBanIcon } from '../../constants/banTypes';

export default function BansTab({ onNavigate }) { // eslint-disable-line no-unused-vars
  const [selectedType, setSelectedType] = useState('all');
  
  const { data: bans, loading: bansLoading } = useSupabaseQuery('bans', '*');
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  
  const loading = bansLoading || playersLoading;

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

  const filteredBans = (() => {
    // Use search results if available, otherwise use all bans
    const bansToFilter = (bans || []);
    
    return bansToFilter.filter(ban => {
      if (selectedType === 'all') return true;
      if (selectedType === 'active') return (ban.totalgames - ban.matchesserved) > 0;
      if (selectedType === 'completed') return (ban.totalgames - ban.matchesserved) === 0;
      return ban.type === selectedType;
    });
  })();

  const activeBans = bans?.filter(ban => (ban.totalgames - ban.matchesserved) > 0) || [];
  const completedBans = bans?.filter(ban => (ban.totalgames - ban.matchesserved) === 0) || [];

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
              count: bans?.filter(ban => ban.type === type.value).length || 0
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
                    {getBanIcon(ban.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-text-primary">
                        {getPlayerName(ban.player_id)}
                      </h3>
                      <span className="text-sm text-text-muted">
                        ({getPlayerTeam(ban.player_id)})
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getBanTypeColor(ban.type)}`}>
                        {ban.type}
                      </span>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        Gesamt: {ban.totalgames || 0} Spiele
                      </span>
                      {(ban.totalgames - ban.matchesserved) > 0 ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Verbleibend: {ban.totalgames - ban.matchesserved} Spiel{(ban.totalgames - ban.matchesserved) !== 1 ? 'e' : ''}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Beendet
                        </span>
                      )}
                    </div>

                    {ban.reason && (
                      <p className="text-sm text-text-muted">
                        {ban.reason}
                      </p>
                    )}
                  </div>
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

      {/* Info Card */}
      <div className="mt-6 modern-card bg-red-50 border-red-200">
        <div className="flex items-start">
          <div className="text-red-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-red-800 mb-1">Hinweis</h4>
            <p className="text-red-700 text-sm">
              Um neue Sperren hinzuzufügen oder zu verwalten, nutzen Sie den Verwaltungsbereich.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}