import { useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import ExportImportManager from '../ExportImportManager';
import toast from 'react-hot-toast';

export default function FinanzenTab() {
  const [selectedTeam, setSelectedTeam] = useState('AEK');
  const [expandedMatches, setExpandedMatches] = useState(new Set());
  const [showExportImport, setShowExportImport] = useState(false);
  
  const { data: finances, loading: financesLoading, refetch: refetchFinances } = useSupabaseQuery('finances', '*');
  const { data: transactions, loading: transactionsLoading } = useSupabaseQuery(
    'transactions', 
    '*', 
    { order: { column: 'id', ascending: false } }
  );
  const { data: matches, loading: matchesLoading } = useSupabaseQuery(
    'matches', 
    '*', 
    { order: { column: 'id', ascending: false } }
  );
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  
  const loading = financesLoading || transactionsLoading || matchesLoading || playersLoading;

  const getTeamFinances = (teamName) => {
    if (!finances) return { balance: 0, debt: 0 };
    return finances.find(f => f.team === teamName) || { balance: 0, debt: 0 };
  };

  const getTeamSquadValue = (teamName) => {
    if (!players) return 0;
    return players
      .filter(p => p.team === teamName)
      .reduce((sum, p) => sum + (p.value || 0), 0);
  };

  const calculateTotalCapital = () => {
    const aekBalance = getTeamFinances('AEK').balance || 0;
    const realBalance = getTeamFinances('Real').balance || 0;
    const aekSquadValueMillions = getTeamSquadValue('AEK');
    const realSquadValueMillions = getTeamSquadValue('Real');
    
    // Convert squad values from millions to euros for total capital calculation
    const aekSquadValueEuros = aekSquadValueMillions * 1_000_000;
    const realSquadValueEuros = realSquadValueMillions * 1_000_000;
    
    return Math.round(aekBalance + realBalance + aekSquadValueEuros + realSquadValueEuros);
  };

  const getTeamTransactions = (teamName) => {
    if (!transactions) return [];
    return transactions.filter(t => t.team === teamName);
  };

  const formatCurrency = (amount) => {
    // Round to whole numbers and format without decimal places
    const roundedAmount = Math.round(amount || 0);
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(roundedAmount);
  };

  const formatCurrencyInMillions = (amount) => {
    // Takes a euro amount and displays it in millions
    // Input: euro amount, Output: "X.XM €"
    const amountInMillions = (amount || 0) / 1000000;
    return `${amountInMillions.toFixed(1)}M €`;
  };

  const formatPlayerValue = (value) => {
    // Helper function for player values which are already stored in millions
    return `${(value || 0).toFixed(1)}M €`;
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'Preisgeld':
      case 'SdS Bonus':
      case 'Sonstiges':
        return 'text-primary-green';
      case 'Strafe':
      case 'Spielerkauf':
        return 'text-accent-red';
      case 'Spielerverkauf':
        return 'text-primary-green';
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
      case 'Spielerverkauf':
        return '💰';
      case 'SdS Bonus':
        return '⭐';
      case 'Echtgeld-Ausgleich':
        return '💳';
      case 'Echtgeld-Ausgleich (getilgt)':
        return '✅';
      default:
        return '💰';
    }
  };

  // Generate unique colors for each match based on match number
  const getMatchColorScheme = (matchNumber) => {
    const colorSchemes = [
      {
        container: "border-blue-400 bg-blue-50 dark:bg-blue-700",
        header: "text-blue-800 dark:text-blue-100",
        accent: "blue-500"
      },
      {
        container: "border-green-600 bg-green-100 dark:bg-green-600", 
        header: "text-green-800 dark:text-green-300",
        accent: "green-600"
      },
      {
        container: "border-red-500 bg-red-50 dark:bg-red-500",
        header: "text-red-800 dark:text-red-100", 
        accent: "red-500"
      },
      {
        container: "border-purple-500 bg-purple-100 dark:bg-purple-500",
        header: "text-purple-700 dark:text-purple-100",
        accent: "purple-500"
      },
      {
        container: "border-yellow-400 bg-yellow-100 dark:bg-yellow-900",
        header: "text-yellow-800 dark:text-yellow-300",
        accent: "yellow-400"
      }
    ];
    
    const schemeIndex = (matchNumber - 1) % colorSchemes.length;
    return colorSchemes[schemeIndex];
  };

  const toggleMatchTransactions = (matchId) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  const groupTransactionsByMatch = () => {
    if (!transactions || !matches) return { matchGroups: [], nonMatchTransactions: [] };
    
    // Sort matches by date (newest first)
    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const matchGroups = [];
    const nonMatchTransactions = [];
    const matchIds = new Set(sortedMatches.map(m => m.id));
    
    // Group transactions by match
    for (const match of sortedMatches) {
      const matchTx = transactions.filter(t => t.match_id === match.id);
      if (matchTx.length) {
        matchGroups.push({ match, transactions: matchTx });
      }
    }
    
    // Find transactions without match_id
    transactions.forEach(t => {
      if (!t.match_id || !matchIds.has(t.match_id)) {
        nonMatchTransactions.push(t);
      }
    });
    
    return { matchGroups, nonMatchTransactions };
  };

  if (loading) {
    return <LoadingSpinner message="Lade Finanzen..." />;
  }

  const aekFinances = getTeamFinances('AEK');
  const realFinances = getTeamFinances('Real');
  const totalCapital = calculateTotalCapital();

  const selectedTeamFinances = getTeamFinances(selectedTeam);
  const selectedTeamTransactions = getTeamTransactions(selectedTeam);
  const { matchGroups, nonMatchTransactions } = groupTransactionsByMatch();

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
          <div className="space-y-1 text-sm">
            <div>Kontostand: <span className="font-bold text-blue-600">{formatCurrency(aekFinances.balance)}</span></div>
            <div>Kaderwert: <span className="font-bold text-blue-600">{formatPlayerValue(getTeamSquadValue('AEK'))}</span></div>
            <div>Schulden: <span className="font-bold text-blue-600">{formatCurrency(aekFinances.debt || 0)}</span></div>
          </div>
        </div>

        <div className="modern-card text-center border-l-4 border-red-400">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">🔴</span>
            <h3 className="font-semibold text-red-600">Real Madrid</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div>Kontostand: <span className="font-bold text-red-600">{formatCurrency(realFinances.balance)}</span></div>
            <div>Kaderwert: <span className="font-bold text-red-600">{formatPlayerValue(getTeamSquadValue('Real'))}</span></div>
            <div>Schulden: <span className="font-bold text-red-600">{formatCurrency(realFinances.debt || 0)}</span></div>
          </div>
        </div>

        <div className="modern-card text-center border-l-4 border-primary-green">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">💰</span>
            <h3 className="font-semibold text-primary-green">Gesamt</h3>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {formatCurrency(totalCapital)}
          </div>
          <div className="text-sm text-text-muted">Gesamtkapital (Bargeld + Kaderwerte)</div>
        </div>
      </div>

      {/* Financial Management Actions */}
      <div className="modern-card mb-6">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <span className="mr-2">💼</span>
          Finanz-Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setShowExportImport(true)}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <span>📥</span>
            <span>Export/Import</span>
          </button>
          <button
            onClick={() => {
              const totalBalance = aekFinances.balance + realFinances.balance;
              const totalSquadValue = (getTeamSquadValue('AEK') + getTeamSquadValue('Real')) * 1000000;
              const liquidity = totalBalance > 0 ? (totalBalance / totalCapital) * 100 : 0;
              
              toast.success(
                `💰 Finanz-Analyse:\n\n` +
                `Bargeld: ${formatCurrency(totalBalance)}\n` +
                `Kaderwerte: ${formatCurrency(totalSquadValue)}\n` +
                `Liquidität: ${liquidity.toFixed(1)}%`,
                { duration: 5000 }
              );
            }}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <span>📊</span>
            <span>Finanz-Analyse</span>
          </button>
          <button
            onClick={() => {
              const recentTransactions = transactions?.slice(0, 5) || [];
              if (recentTransactions.length === 0) {
                toast.error('Keine Transaktionen vorhanden');
                return;
              }
              
              const summary = recentTransactions.map(t => 
                `${t.type}: ${formatCurrency(t.amount)} (${t.team || 'Unbekannt'})`
              ).join('\n');
              
              toast.success(
                `📋 Letzte Transaktionen:\n\n${summary}`,
                { duration: 6000 }
              );
            }}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <span>📋</span>
            <span>Letzte Aktivitäten</span>
          </button>
        </div>
      </div>

      {/* Match-grouped Transactions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Match-Transaktionen
        </h3>
        
        {matchGroups.length > 0 ? (
          <div className="space-y-3">
            {matchGroups.map(({ match, transactions: matchTransactions }, index) => {
              const matchNumber = matchGroups.length - index;
              const colorScheme = getMatchColorScheme(matchNumber);
              const isCollapsed = !expandedMatches.has(match.id);
              
              return (
                <div key={match.id} className={`border-2 ${colorScheme.container} rounded-lg shadow-lg`}>
                  <button
                    onClick={() => toggleMatchTransactions(match.id)}
                    className="w-full p-3 flex items-center justify-between cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded-t-lg"
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 bg-${colorScheme.accent} rounded-full mr-2 flex-shrink-0`}></div>
                      <div className="text-left">
                        <div className={`text-lg font-extrabold ${colorScheme.header}`}>
                          AEK {match.goalsa || 0}:{match.goalsb || 0} Real
                        </div>
                        <div className={`text-xs font-normal opacity-90 ${colorScheme.header}`}>
                          {new Date(match.date).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs bg-${colorScheme.accent} text-white px-2 py-1 rounded-full font-semibold`}>
                        {matchTransactions.length} Transaktion{matchTransactions.length !== 1 ? 'en' : ''}
                      </div>
                      <span className={`text-lg font-bold ${colorScheme.header} transition-transform duration-200 ${isCollapsed ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </div>
                  </button>
                  
                  {!isCollapsed && (
                    <div className="p-3 pt-0">
                      <div className="space-y-2">
                        {matchTransactions.map((transaction) => (
                          <div key={transaction.id} className="bg-white bg-opacity-50 rounded-lg p-3 border border-white border-opacity-30">
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
                                  
                                  <div className="flex items-center space-x-2 text-xs text-text-muted">
                                    <span className={transaction.team === 'AEK' ? 'text-blue-600' : 'text-red-600'}>
                                      {transaction.team === 'AEK' ? '🔵' : '🔴'} {transaction.team}
                                    </span>
                                    {transaction.date && (
                                      <span>
                                        {new Date(transaction.date).toLocaleDateString('de-DE')}
                                      </span>
                                    )}
                                  </div>
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="modern-card text-center py-8">
            <div className="text-4xl mb-4">⚽</div>
            <h4 className="text-lg font-medium text-text-primary mb-2">
              Keine Match-Transaktionen
            </h4>
            <p className="text-text-muted">
              Es wurden noch keine match-bezogenen Transaktionen erfasst.
            </p>
          </div>
        )}
      </div>

      {/* Non-Match Transactions */}
      {nonMatchTransactions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Sonstige Transaktionen
          </h3>
          
          <div className="border-2 border-slate-500 bg-slate-100 rounded-lg shadow-lg">
            <div className="p-3 border-b border-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-slate-400 rounded-full mr-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-lg font-extrabold text-slate-700">
                      Sonstige Transaktionen
                    </div>
                    <div className="text-xs font-normal opacity-90 text-slate-600">
                      Nicht match-bezogene Buchungen
                    </div>
                  </div>
                </div>
                <div className="text-xs bg-slate-400 text-slate-900 px-2 py-1 rounded-full font-semibold">
                  {nonMatchTransactions.length} Buchung{nonMatchTransactions.length !== 1 ? 'en' : ''}
                </div>
              </div>
            </div>
            
            <div className="p-3">
              <div className="space-y-2">
                {nonMatchTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-white rounded-lg p-3 border border-slate-200">
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
                          
                          <div className="flex items-center space-x-2 text-xs text-text-muted">
                            <span className={transaction.team === 'AEK' ? 'text-blue-600' : 'text-red-600'}>
                              {transaction.team === 'AEK' ? '🔵' : '🔴'} {transaction.team}
                            </span>
                            {transaction.date && (
                              <span>
                                {new Date(transaction.date).toLocaleDateString('de-DE')}
                              </span>
                            )}
                          </div>
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
            </div>
          </div>
        </div>
      )}

      {/* Team Selection for Individual View */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          Team-spezifische Ansicht
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
                    : 'bg-red-600 text-white'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary border border-border-light'
              }`}
            >
              {team === 'AEK' ? '🔵 AEK Athen' : '🔴 Real Madrid'}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Team Details */}
      <div className="modern-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-text-primary">
            {selectedTeam === 'AEK' ? '🔵 AEK Athen' : '🔴 Real Madrid'} - Details
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

      {/* Info Card */}
      <div className="mt-6 modern-card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Hinweis zu Marktwerten</h4>
            <p className="text-blue-700 text-sm">
              Spieler-Marktwerte werden in der Datenbank in Millionen Euro gespeichert (z.B. 12.5 = 12,5M €).
              Für die Gesamtkapital-Berechnung werden diese automatisch in Euro umgerechnet.
            </p>
          </div>
        </div>
      </div>

      {/* Previous Info Card */}
      <div className="mt-6 modern-card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3">
            <i className="fas fa-info-circle"></i>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Transaktionen verwalten</h4>
            <p className="text-blue-700 text-sm">
              Um neue Transaktionen hinzuzufügen, nutzen Sie den Verwaltungsbereich.
            </p>
          </div>
        </div>
      </div>

      {/* Export/Import Modal */}
      {showExportImport && (
        <ExportImportManager onClose={() => setShowExportImport(false)} />
      )}
    </div>
  );
}