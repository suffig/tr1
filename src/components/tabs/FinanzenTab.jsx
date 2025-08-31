import { useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

export default function FinanzenTab() {
  const [selectedTeam, setSelectedTeam] = useState('AEK');
  
  const { data: finances, loading: financesLoading, refetch: refetchFinances } = useSupabaseQuery('finances', '*');
  const { data: transactions, loading: transactionsLoading } = useSupabaseQuery(
    'transactions', 
    '*', 
    { order: { column: 'id', ascending: false }, limit: 20 }
  );
  
  const loading = financesLoading || transactionsLoading;

  const getTeamFinances = (teamName) => {
    if (!finances) return { balance: 0 };
    return finances.find(f => f.team === teamName) || { balance: 0 };
  };

  const getTeamTransactions = (teamName) => {
    if (!transactions) return [];
    return transactions.filter(t => t.team === teamName);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'Preisgeld':
      case 'Sonstiges':
        return 'text-primary-green';
      case 'Strafe':
      case 'Spielerkauf':
        return 'text-accent-red';
      default:
        return 'text-text-primary';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Preisgeld':
        return '🏆';
      case 'Sonstiges':
        return '📈';
      case 'Strafe':
        return '📉';
      case 'Spielerkauf':
        return '👤';
      case 'SdS Bonus':
        return '⭐';
      default:
        return '💰';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Lade Finanzen..." />;
  }

  const aekFinances = getTeamFinances('AEK');
  const realFinances = getTeamFinances('Real');
  const totalBalance = aekFinances.balance + realFinances.balance;

  const selectedTeamFinances = getTeamFinances(selectedTeam);
  const selectedTeamTransactions = getTeamTransactions(selectedTeam);

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Finanzen
        </h2>
        <p className="text-text-muted">
          Team-Budgets und Transaktionsübersicht
        </p>
      </div>

      {/* Team Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="modern-card text-center border-l-4 border-blue-400">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">🔵</span>
            <h3 className="font-semibold text-blue-600">AEK Athen</h3>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(aekFinances.balance)}
          </div>
          <div className="text-sm text-text-muted">Aktueller Kontostand</div>
        </div>

        <div className="modern-card text-center border-l-4 border-purple-400">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">🟣</span>
            <h3 className="font-semibold text-purple-600">Real Madrid</h3>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(realFinances.balance)}
          </div>
          <div className="text-sm text-text-muted">Aktueller Kontostand</div>
        </div>

        <div className="modern-card text-center border-l-4 border-primary-green">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">💰</span>
            <h3 className="font-semibold text-primary-green">Gesamt</h3>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(totalBalance)}
          </div>
          <div className="text-sm text-text-muted">Gesamtkapital</div>
        </div>
      </div>

      {/* Team Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          Transaktionen
        </h3>
        
        <div className="flex gap-2 mb-4">
          {['AEK', 'Real'].map((team) => (
            <button
              key={team}
              onClick={() => setSelectedTeam(team)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTeam === team
                  ? team === 'AEK' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-purple-600 text-white'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary border border-border-light'
              }`}
            >
              {team === 'AEK' ? '🔵 AEK Athen' : '🟣 Real Madrid'}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Team Details */}
      <div className="modern-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-text-primary">
            {selectedTeam === 'AEK' ? '🔵 AEK Athen' : '🟣 Real Madrid'} - Details
          </h4>
          <div className="text-right">
            <div className="text-lg font-bold text-text-primary">
              {formatCurrency(selectedTeamFinances.balance)}
            </div>
            <div className="text-sm text-text-muted">Aktueller Kontostand</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary-green/10 rounded-lg">
            <div className="text-lg font-bold text-primary-green">
              {selectedTeamTransactions.filter(t => t.amount > 0).length}
            </div>
            <div className="text-sm text-text-muted">Einnahmen</div>
          </div>
          <div className="text-center p-3 bg-accent-red/10 rounded-lg">
            <div className="text-lg font-bold text-accent-red">
              {selectedTeamTransactions.filter(t => t.amount < 0).length}
            </div>
            <div className="text-sm text-text-muted">Ausgaben</div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {selectedTeamTransactions.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-semibold text-text-primary">
            Letzte Transaktionen - {selectedTeam === 'AEK' ? 'AEK Athen' : 'Real Madrid'}
          </h4>
          
          {selectedTeamTransactions.map((transaction) => (
            <div key={transaction.id} className="modern-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-xl">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-medium text-text-primary">
                        {transaction.info || 'Transaktion'}
                      </h5>
                      <span className={`text-sm font-medium ${
                        transaction.amount > 0 
                          ? 'text-primary-green' 
                          : 'text-accent-red'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                    
                    {transaction.date && (
                      <p className="text-xs text-text-muted">
                        {new Date(transaction.date).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${getTransactionTypeColor(transaction.type)}`}>
                    {transaction.amount < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(transaction.amount || 0))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💰</div>
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Keine Transaktionen
          </h4>
          <p className="text-text-muted">
            Für {selectedTeam === 'AEK' ? 'AEK Athen' : 'Real Madrid'} wurden noch keine Transaktionen erfasst.
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 modern-card bg-purple-50 border-purple-200">
        <div className="flex items-start">
          <div className="text-purple-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-purple-800 mb-1">Hinweis</h4>
            <p className="text-purple-700 text-sm">
              Um neue Transaktionen hinzuzufügen, nutzen Sie den Verwaltungsbereich.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}