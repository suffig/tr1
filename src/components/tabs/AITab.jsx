import { useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import toast from 'react-hot-toast';

export default function AITab({ onNavigate }) { // eslint-disable-line no-unused-vars
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch data for AI analysis
  const { data: players } = useSupabaseQuery('players', '*');
  const { data: matches } = useSupabaseQuery('matches', '*', { order: { column: 'date', ascending: false } });
  const { data: transactions } = useSupabaseQuery('transactions', '*');

  const aiFeatures = [
    {
      id: 'team-performance',
      icon: '📊',
      title: 'Team-Performance Analyse',
      description: 'KI-basierte Analyse der Team-Leistung über Zeit',
      action: () => analyzeTeamPerformance()
    },
    {
      id: 'player-valuation',
      icon: '💰',
      title: 'Spieler-Bewertung',
      description: 'KI bewertet Spieler basierend auf Performance und Marktwert',
      action: () => analyzePlayerValuation()
    },
    {
      id: 'transfer-predictor',
      icon: '🔮',
      title: 'Transfer Vorhersagen',
      description: 'Voraussage von zukünftigen Transfers basierend auf Trends',
      action: () => predictTransfers()
    },
    {
      id: 'formation-optimizer',
      icon: '⚽',
      title: 'Aufstellungs-Optimierer',
      description: 'Optimale Aufstellung basierend auf Spieler-Stärken',
      action: () => optimizeFormation()
    },
    {
      id: 'injury-predictor',
      icon: '🏥',
      title: 'Verletzungsrisiko',
      description: 'Analyse des Verletzungsrisikos von Spielern',
      action: () => analyzeInjuryRisk()
    },
    {
      id: 'financial-forecast',
      icon: '📈',
      title: 'Finanz-Prognose',
      description: 'Vorhersage der finanziellen Entwicklung',
      action: () => forecastFinances()
    }
  ];

  const analyzeTeamPerformance = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!matches || matches.length === 0) {
        toast.error('Nicht genügend Spieldaten für Analyse');
        return;
      }

      const recentMatches = matches.slice(0, 10);
      const aekWins = recentMatches.filter(m => (m.goalsa || 0) > (m.goalsb || 0)).length;
      const realWins = recentMatches.filter(m => (m.goalsb || 0) > (m.goalsa || 0)).length;
      const draws = recentMatches.length - aekWins - realWins;

      const analysis = {
        title: '🤖 KI Team-Performance Analyse',
        data: `
📊 Analyse der letzten ${recentMatches.length} Spiele:

🟦 AEK Performance:
• Siege: ${aekWins} (${((aekWins/recentMatches.length)*100).toFixed(1)}%)
• Trend: ${aekWins > realWins ? 'Steigend 📈' : aekWins === realWins ? 'Stabil ↔️' : 'Fallend 📉'}

🟥 Real Performance:
• Siege: ${realWins} (${((realWins/recentMatches.length)*100).toFixed(1)}%)
• Trend: ${realWins > aekWins ? 'Steigend 📈' : realWins === aekWins ? 'Stabil ↔️' : 'Fallend 📉'}

⚪ Unentschieden: ${draws}

🎯 KI-Empfehlung:
${aekWins > realWins ? 'AEK zeigt starke Form - weiter so!' : 
  realWins > aekWins ? 'Real dominiert - AEK sollte Taktik überdenken' :
  'Ausgeglichene Teams - spannende Zukunft!'}
        `
      };

      setSelectedAnalysis(analysis);
      toast.success('🤖 KI-Analyse abgeschlossen!');
    } catch (error) {
      toast.error('Fehler bei der KI-Analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzePlayerValuation = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!players || players.length === 0) {
        toast.error('Keine Spielerdaten für Analyse verfügbar');
        return;
      }

      const sortedPlayers = [...players].sort((a, b) => (b.value || 0) - (a.value || 0));
      const topPlayer = sortedPlayers[0];
      const avgValue = players.reduce((sum, p) => sum + (p.value || 0), 0) / players.length;
      const undervalued = players.filter(p => (p.value || 0) < avgValue * 0.5);

      const analysis = {
        title: '🤖 KI Spieler-Bewertung',
        data: `
💎 Top-Spieler: ${topPlayer.name} (${topPlayer.value}M €)
📊 Durchschnittswert: ${avgValue.toFixed(1)}M €
👥 Gesamt Spieler: ${players.length}

🔍 Unterbewertete Talente (< ${(avgValue * 0.5).toFixed(1)}M €):
${undervalued.slice(0, 5).map(p => `• ${p.name} - ${p.value}M € (${p.position})`).join('\n')}

🎯 KI-Empfehlung:
${undervalued.length > 0 ? 
  `Investition in ${undervalued[0].name} könnte sich lohnen!` :
  'Portfolio ist gut ausbalanciert.'}
        `
      };

      setSelectedAnalysis(analysis);
      toast.success('🤖 Spieler-Analyse abgeschlossen!');
    } catch (error) {
      toast.error('Fehler bei der Spieler-Analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const predictTransfers = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      if (!players || players.length === 0) {
        toast.error('Keine Spielerdaten für Transfer-Analyse verfügbar');
        return;
      }

      // Analyze current team compositions
      const aekPlayers = players.filter(p => p.team === 'AEK');
      const realPlayers = players.filter(p => p.team === 'Real');
      const currentPositions = [...aekPlayers, ...realPlayers].reduce((acc, player) => {
        acc[player.position] = (acc[player.position] || 0) + 1;
        return acc;
      }, {});

      // Simulate realistic Transfermarkt.de player suggestions
      const transfermarktSuggestions = [
        {
          name: 'Pedri González',
          position: 'ZOM',
          age: 21,
          marketValue: 80.0,
          eafc25Rating: 85,
          club: 'FC Barcelona',
          nationality: 'Spanien',
          reason: 'Junges Talent mit enormem Potenzial',
          pros: ['Kreative Pässe', 'Technisch versiert', 'Ballsicher'],
          cons: ['Noch jung', 'Hoher Preis'],
          fitScore: 92
        },
        {
          name: 'Jamal Musiala',
          position: 'LF',
          age: 21,
          marketValue: 100.0,
          eafc25Rating: 84,
          club: 'FC Bayern München',
          nationality: 'Deutschland',
          reason: 'Perfekt für flexibles Offensivspiel',
          pros: ['Dribbling-Künstler', 'Vielseitig', 'Torgefährlich'],
          cons: ['Sehr teuer', 'Hohe Konkurrenz'],
          fitScore: 89
        },
        {
          name: 'Eduardo Camavinga',
          position: 'ZDM',
          age: 22,
          marketValue: 90.0,
          eafc25Rating: 83,
          club: 'Real Madrid',
          nationality: 'Frankreich',
          reason: 'Stabilität im defensiven Mittelfeld',
          pros: ['Defensive Stärke', 'Passspiel', 'Jung'],
          cons: ['Teuer', 'Könnte zu Real passen'],
          fitScore: 87
        },
        {
          name: 'Florian Wirtz',
          position: 'ZOM',
          age: 21,
          marketValue: 85.0,
          eafc25Rating: 82,
          club: 'Bayer Leverkusen',
          nationality: 'Deutschland',
          reason: 'Deutscher Spielmacher der Zukunft',
          pros: ['Kreativität', 'Tore + Assists', 'Bundesliga-erprobt'],
          cons: ['Verletzungshistorie', 'Hohe Erwartungen'],
          fitScore: 91
        },
        {
          name: 'Arda Güler',
          position: 'RV',
          age: 19,
          marketValue: 25.0,
          eafc25Rating: 77,
          club: 'Real Madrid',
          nationality: 'Türkei',
          reason: 'Günstiges Talent mit Potenzial',
          pros: ['Günstig', 'Hohes Potenzial', 'Junge Jahre'],
          cons: ['Unerfahren', 'Entwicklung unsicher'],
          fitScore: 78
        }
      ];

      // Filter suggestions based on team needs
      const positionNeeds = Object.keys(currentPositions).length < 5 ? ['ZOM', 'ST', 'IV'] : 
                           currentPositions['ST'] < 2 ? ['ST', 'LF', 'RF'] :
                           currentPositions['IV'] < 2 ? ['IV', 'LV', 'RV'] : ['ZM', 'ZOM'];
      
      const relevantSuggestions = transfermarktSuggestions
        .filter(player => positionNeeds.includes(player.position))
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 3);

      const budgetAnalysis = players.reduce((sum, p) => sum + (p.value || 0), 0) / players.length;

      const analysis = {
        title: '🔮 KI Transfer-Vorhersagen (Transfermarkt.de)',
        data: `
🌐 TRANSFERMARKT.DE EMPFEHLUNGEN

📊 Team-Analyse:
• AEK Spieler: ${aekPlayers.length}
• Real Spieler: ${realPlayers.length}
• Ø Marktwert: ${budgetAnalysis.toFixed(1)}M €
• Schwächste Positionen: ${positionNeeds.join(', ')}

🎯 TOP TRANSFER-EMPFEHLUNGEN:

${relevantSuggestions.map((player, index) => `
${index + 1}. ${player.name} (${player.age} Jahre)
   🏃 Position: ${player.position}
   💰 Marktwert: ${player.marketValue}M €
   🎮 EA FC 25: ${player.eafc25Rating}/100
   🏆 Verein: ${player.club}
   🌍 Nation: ${player.nationality}
   
   ✅ Stärken: ${player.pros.join(', ')}
   ⚠️ Schwächen: ${player.cons.join(', ')}
   🎯 Team-Fit: ${player.fitScore}%
   
   💡 Grund: ${player.reason}
`).join('\n')}

💼 MARKT-TRENDS:
• Offensive Mittelfeldspieler +15% Wert
• Junge Verteidiger sehr gefragt
• Bundesliga-Talente haben Preisaufschlag
• Premier League-Spieler überteuert

🔍 ALTERNATIVE MÄRKTE:
• Eredivisie: Günstige Talente
• Liga Portugal: Technische Spieler
• Serie A: Taktisch versierte Profis

📈 VERKAUFS-EMPFEHLUNGEN:
${players.filter(p => (p.value || 0) > budgetAnalysis * 1.5).slice(0, 2).map(p => `• ${p.name} (${p.value}M €) - Überdurchschnittlich wertvoll`).join('\n')}

🎯 BUDGET-EMPFEHLUNG:
Verfügbares Budget: ~${(budgetAnalysis * players.length * 0.3).toFixed(0)}M €
Idealer Neuzugang: ${relevantSuggestions[0]?.name || 'Siehe Empfehlungen'}
        `
      };

      setSelectedAnalysis(analysis);
      toast.success('🌐 Transfermarkt.de Analyse abgeschlossen!');
    } catch (error) {
      toast.error('Fehler bei der Transfer-Vorhersage');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const optimizeFormation = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2200));
      
      const analysis = {
        title: '⚽ KI Aufstellungs-Optimierer',
        data: `
🤖 Optimale Formation basierend auf verfügbaren Spielern:

🏆 Empfohlene Formation: 4-3-3

📋 Aufstellung:
         TH
    LV - IV - IV - RV
      ZDM - ZM - ZOM
    LF - ST - RF

🎯 Stärken dieser Formation:
• Ausgewogene Defensive
• Starkes Mittelfeld
• Flexible Offensive

💡 KI-Tipps:
• ZM als Spielmacher einsetzen
• LF/RF für Breite sorgen lassen
• ZDM als Absicherung

⚡ Alternative: 4-4-2 für mehr Defensive
        `
      };

      setSelectedAnalysis(analysis);
      toast.success('⚽ Formation optimiert!');
    } catch (error) {
      toast.error('Fehler bei der Formations-Optimierung');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeInjuryRisk = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1600));
      
      const analysis = {
        title: '🏥 KI Verletzungsrisiko-Analyse',
        data: `
🤖 Verletzungsrisiko-Bewertung:

⚠️ Risiko-Faktoren:
• Intensität der Spiele: Hoch
• Spieler-Rotation: Mittel
• Belastungsmanagement: Verbesserungsbedarf

📊 Risiko-Kategorien:
🔴 Hoch-Risiko: Stammspieler (> 80% Einsatzzeit)
🟡 Mittel-Risiko: Rotationsspieler
🟢 Niedrig-Risiko: Ersatzspieler

🎯 Präventions-Empfehlungen:
• Mehr Rotation bei Stammspielern
• Regenerationspausen einhalten
• Fitness-Monitoring verstärken
• Aufwärmroutinen optimieren

💊 Vorsorgemaßnahmen:
• Physiotherapie nach intensiven Spielen
• Ernährungsoptimierung
• Schlafqualität verbessern
        `
      };

      setSelectedAnalysis(analysis);
      toast.success('🏥 Verletzungsrisiko analysiert!');
    } catch (error) {
      toast.error('Fehler bei der Risiko-Analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const forecastFinances = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1900));
      
      if (!transactions) {
        toast.error('Keine Finanzdaten für Prognose verfügbar');
        return;
      }

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netResult = totalIncome - totalExpenses;

      const analysis = {
        title: '📈 KI Finanz-Prognose',
        data: `
🤖 Finanzielle Zukunftsanalyse:

💰 Aktuelle Bilanz:
• Einnahmen: ${totalIncome.toFixed(1)}M €
• Ausgaben: ${totalExpenses.toFixed(1)}M €
• Saldo: ${netResult.toFixed(1)}M € ${netResult >= 0 ? '✅' : '⚠️'}

📊 6-Monats-Prognose:
• Erwartete Einnahmen: ${(totalIncome * 1.2).toFixed(1)}M €
• Geschätzte Ausgaben: ${(totalExpenses * 1.15).toFixed(1)}M €
• Voraussichtlicher Saldo: ${(netResult * 1.1).toFixed(1)}M €

🎯 KI-Empfehlungen:
${netResult >= 0 ? 
  '• Stabile Finanzlage - Investitionen möglich\n• Transferbudget: ~' + (netResult * 0.7).toFixed(1) + 'M €' :
  '• Ausgaben reduzieren\n• Transferverkäufe erwägen\n• Kostenoptimierung nötig'}

🔮 Langzeit-Trend: ${netResult >= 0 ? 'Positiv 📈' : 'Kritisch 📉'}
        `
      };

      setSelectedAnalysis(analysis);
      toast.success('📈 Finanz-Prognose erstellt!');
    } catch (error) {
      toast.error('Fehler bei der Finanz-Prognose');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2 flex items-center">
          <span className="mr-3">🤖</span>
          KI-Assistent
        </h2>
        <p className="text-text-muted">
          Intelligente Analysen und Vorhersagen für dein Team
        </p>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {aiFeatures.map((feature) => (
          <button
            key={feature.id}
            onClick={feature.action}
            disabled={isAnalyzing}
            className="p-4 bg-bg-secondary border border-border-light rounded-lg hover:bg-bg-tertiary hover:border-primary-green transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">{feature.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-primary-green bg-opacity-10 border border-primary-green rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full"></div>
            <div>
              <h3 className="font-semibold text-primary-green">🤖 KI analysiert...</h3>
              <p className="text-sm text-text-secondary">Bitte warten Sie, während die KI die Daten verarbeitet.</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {selectedAnalysis && (
        <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-text-primary">{selectedAnalysis.title}</h3>
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-text-primary font-mono bg-bg-primary p-4 rounded border border-border-light overflow-x-auto">
            {selectedAnalysis.data}
          </pre>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedAnalysis.data);
                toast.success('Analyse in Zwischenablage kopiert!');
              }}
              className="px-3 py-1 bg-primary-green text-white rounded text-sm hover:bg-green-600 transition-colors"
            >
              📋 Kopieren
            </button>
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="px-3 py-1 bg-bg-tertiary border border-border-light rounded text-sm hover:bg-bg-primary transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* AI Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">💡 KI-Tipps</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Nutze mehrere Analysen für bessere Einschätzungen</li>
          <li>• KI-Empfehlungen sind Vorschläge - finale Entscheidung liegt bei dir</li>
          <li>• Regelmäßige Analysen helfen bei der Trend-Erkennung</li>
          <li>• Kombiniere KI-Insights mit eigener Spielerfahrung</li>
        </ul>
      </div>
    </div>
  );
}