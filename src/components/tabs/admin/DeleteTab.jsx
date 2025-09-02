import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../../hooks/useSupabase';
import { TEAMS } from '../../../constants/teams';
import LoadingSpinner from '../../LoadingSpinner';
import toast from 'react-hot-toast';

export default function DeleteTab() {
  const [activeSection, setActiveSection] = useState('players');
  const [loading, setLoading] = useState(false);

  // Data queries
  const { data: players, refetch: refetchPlayers } = useSupabaseQuery('players', '*');
  const { data: matches, refetch: refetchMatches } = useSupabaseQuery('matches', '*');
  const { data: bans, refetch: refetchBans } = useSupabaseQuery('bans', '*');
  const { data: transactions, refetch: refetchTransactions } = useSupabaseQuery('transactions', '*');

  // Mutations
  const { remove: removePlayer } = useSupabaseMutation('players');
  const { remove: removeBan } = useSupabaseMutation('bans');
  const { remove: removeTransaction } = useSupabaseMutation('transactions');

  const sections = [
    { id: 'players', label: 'Spieler löschen', icon: 'fas fa-users' },
    { id: 'matches', label: 'Spiele löschen', icon: 'fas fa-futbol' },
    { id: 'bans', label: 'Sperren löschen', icon: 'fas fa-ban' },
    { id: 'transactions', label: 'Transaktionen löschen', icon: 'fas fa-euro-sign' },
  ];

  const handleDeletePlayer = async (player) => {
    if (!confirm(`Sind Sie sicher, dass Sie ${player.name} löschen möchten?`)) return;
    
    setLoading(true);
    try {
      await removePlayer(player.id);
      toast.success(`Spieler ${player.name} erfolgreich gelöscht`);
      refetchPlayers();
    } catch (error) {
      toast.error('Fehler beim Löschen des Spielers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (match) => {
    if (!confirm(`Sind Sie sicher, dass Sie das Spiel vom ${new Date(match.date).toLocaleDateString('de-DE')} löschen möchten?`)) return;
    
    setLoading(true);
    try {
      // Use the existing deleteMatch function from matches.js
      const { deleteMatch } = await import('../../../../matches.js');
      await deleteMatch(match.id);
      toast.success('Spiel erfolgreich gelöscht');
      refetchMatches();
    } catch (error) {
      toast.error('Fehler beim Löschen des Spiels: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBan = async (ban) => {
    if (!confirm(`Sind Sie sicher, dass Sie die Sperre für ${ban.player_name} löschen möchten?`)) return;
    
    setLoading(true);
    try {
      await removeBan(ban.id);
      toast.success(`Sperre für ${ban.player_name} erfolgreich gelöscht`);
      refetchBans();
    } catch (error) {
      toast.error('Fehler beim Löschen der Sperre: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!confirm(`Sind Sie sicher, dass Sie die Transaktion "${transaction.type}" löschen möchten?`)) return;
    
    setLoading(true);
    try {
      await removeTransaction(transaction.id);
      toast.success('Transaktion erfolgreich gelöscht');
      refetchTransactions();
    } catch (error) {
      toast.error('Fehler beim Löschen der Transaktion: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTeamIcon = (team) => {
    const teamData = TEAMS.find(t => t.value === team);
    return teamData ? teamData.icon : '⚫';
  };

  const renderPlayersList = () => {
    if (!players || players.length === 0) {
      return <p className="text-text-muted text-center py-4">Keine Spieler vorhanden</p>;
    }

    return (
      <div className="space-y-2">
        {players.map((player) => (
          <div key={player.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getTeamIcon(player.team)}</span>
              <div>
                <h4 className="font-medium text-text-primary">{player.name}</h4>
                <p className="text-sm text-text-muted">{player.team} • {player.position}</p>
              </div>
            </div>
            <button
              onClick={() => handleDeletePlayer(player)}
              disabled={loading}
              className="btn-secondary btn-sm text-accent-red hover:bg-red-50 disabled:opacity-50"
            >
              <i className="fas fa-trash mr-1"></i>
              Löschen
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMatchesList = () => {
    if (!matches || matches.length === 0) {
      return <p className="text-text-muted text-center py-4">Keine Spiele vorhanden</p>;
    }

    return (
      <div className="space-y-2">
        {matches.map((match) => (
          <div key={match.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div>
              <h4 className="font-medium text-text-primary">
                {new Date(match.date).toLocaleDateString('de-DE')}
              </h4>
              <p className="text-sm text-text-muted">
                AEK {match.prizeaek} - {match.prizereal} Real
              </p>
            </div>
            <button
              onClick={() => handleDeleteMatch(match)}
              disabled={loading}
              className="btn-secondary btn-sm text-accent-red hover:bg-red-50 disabled:opacity-50"
            >
              <i className="fas fa-trash mr-1"></i>
              Löschen
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderBansList = () => {
    if (!bans || bans.length === 0) {
      return <p className="text-text-muted text-center py-4">Keine Sperren vorhanden</p>;
    }

    return (
      <div className="space-y-2">
        {bans.map((ban) => (
          <div key={ban.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getTeamIcon(ban.team)}</span>
              <div>
                <h4 className="font-medium text-text-primary">{ban.player_name}</h4>
                <p className="text-sm text-text-muted">{ban.type} • {ban.duration} Spiele</p>
              </div>
            </div>
            <button
              onClick={() => handleDeleteBan(ban)}
              disabled={loading}
              className="btn-secondary btn-sm text-accent-red hover:bg-red-50 disabled:opacity-50"
            >
              <i className="fas fa-trash mr-1"></i>
              Löschen
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderTransactionsList = () => {
    if (!transactions || transactions.length === 0) {
      return <p className="text-text-muted text-center py-4">Keine Transaktionen vorhanden</p>;
    }

    return (
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getTeamIcon(transaction.team)}</span>
              <div>
                <h4 className="font-medium text-text-primary">{transaction.type}</h4>
                <p className="text-sm text-text-muted">
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}M € 
                  {transaction.date && ` • ${new Date(transaction.date).toLocaleDateString('de-DE')}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDeleteTransaction(transaction)}
              disabled={loading}
              className="btn-secondary btn-sm text-accent-red hover:bg-red-50 disabled:opacity-50"
            >
              <i className="fas fa-trash mr-1"></i>
              Löschen
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'players':
        return renderPlayersList();
      case 'matches':
        return renderMatchesList();
      case 'bans':
        return renderBansList();
      case 'transactions':
        return renderTransactionsList();
      default:
        return renderPlayersList();
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Daten löschen
        </h3>
        <p className="text-text-muted text-sm">
          Verwalten Sie die Löschung von Spielern, Spielen, Sperren und Transaktionen.
        </p>
      </div>

      {/* Section Navigation */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-accent-red text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <i className={`${section.icon} mr-2`}></i>
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="modern-card">
        {loading && <LoadingSpinner message="Lösche..." />}
        {!loading && renderSectionContent()}
      </div>

      {/* Warning */}
      <div className="mt-6 modern-card bg-red-50 border-red-200">
        <div className="flex items-start">
          <div className="text-red-600 mr-3">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-red-800 mb-1">Achtung</h4>
            <p className="text-red-700 text-sm">
              Das Löschen von Daten ist permanent und kann nicht rückgängig gemacht werden. 
              Bitte überprüfen Sie Ihre Auswahl sorgfältig, bevor Sie fortfahren.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}