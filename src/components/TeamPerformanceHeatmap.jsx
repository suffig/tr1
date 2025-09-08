import { useState, useMemo, useCallback } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import LoadingSpinner from './LoadingSpinner';

/**
 * TeamPerformanceHeatmap.jsx - Zeitbasierte Leistungsvisualisierung
 * Features:
 * - Wöchentliche/monatliche Ansichten mit Intensitäts-Färbung
 * - Interaktive Tooltips mit detaillierten Metriken
 * - Performance visualization over time
 */
export default function TeamPerformanceHeatmap({ onNavigate }) {
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'
  const [selectedTeam, setSelectedTeam] = useState('both'); // 'AEK', 'Real', or 'both'
  const [selectedMetric, setSelectedMetric] = useState('winRate'); // 'winRate', 'goals', 'form'
  const [hoveredCell, setHoveredCell] = useState(null);
  const [timeRange, setTimeRange] = useState('3months'); // '1month', '3months', '6months', '1year'

  // Fetch data
  const { data: matches, loading: matchesLoading } = useSupabaseQuery('matches', '*', {
    order: { column: 'date', ascending: false }
  });
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');

  const loading = matchesLoading || playersLoading;

  // Calculate heatmap data
  const heatmapData = useMemo(() => {
    if (!matches || !players) return { periods: [], maxValue: 0, minValue: 0 };

    const now = new Date();
    const periods = [];
    let startDate, endDate;

    // Calculate time range
    switch (timeRange) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }

    endDate = now;

    // Generate periods based on view mode
    if (viewMode === 'weekly') {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        periods.push({
          start: new Date(weekStart),
          end: new Date(weekEnd),
          label: `KW ${getWeekNumber(weekStart)}`,
          fullLabel: `${weekStart.toLocaleDateString('de-DE')} - ${weekEnd.toLocaleDateString('de-DE')}`
        });
        
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        periods.push({
          start: new Date(monthStart),
          end: new Date(monthEnd),
          label: monthStart.toLocaleDateString('de-DE', { month: 'short' }),
          fullLabel: monthStart.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    // Calculate performance metrics for each period
    const teamsToAnalyze = selectedTeam === 'both' ? ['AEK', 'Real'] : [selectedTeam];
    let maxValue = 0;
    let minValue = Infinity;

    periods.forEach(period => {
      const periodMatches = matches.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate >= period.start && matchDate <= period.end;
      });

      teamsToAnalyze.forEach(team => {
        const teamData = calculateTeamPerformance(periodMatches, team, players, selectedMetric);
        period[`${team}_data`] = teamData;
        
        if (teamData.value > maxValue) maxValue = teamData.value;
        if (teamData.value < minValue) minValue = teamData.value;
      });
    });

    return { periods, maxValue, minValue: minValue === Infinity ? 0 : minValue };
  }, [matches, players, viewMode, selectedTeam, selectedMetric, timeRange]);

  // Get cell color based on performance value
  const getCellColor = useCallback((value, maxValue, minValue) => {
    if (value === 0) return 'bg-gray-100';
    
    const range = maxValue - minValue;
    const normalizedValue = range > 0 ? (value - minValue) / range : 0;
    
    // Generate color intensity based on metric type
    if (selectedMetric === 'winRate' || selectedMetric === 'form') {
      // Green scale for positive metrics
      const intensity = Math.floor(normalizedValue * 5) + 1;
      return `heatmap-green-${intensity}`;
    } else {
      // Blue scale for other metrics
      const intensity = Math.floor(normalizedValue * 5) + 1;
      return `heatmap-blue-${intensity}`;
    }
  }, [selectedMetric]);

  // Get metric label and unit
  const getMetricInfo = useCallback(() => {
    switch (selectedMetric) {
      case 'winRate':
        return { label: 'Siegquote', unit: '%', description: 'Prozentsatz der gewonnenen Spiele' };
      case 'goals':
        return { label: 'Tore pro Spiel', unit: '⚽', description: 'Durchschnittliche Anzahl Tore pro Spiel' };
      case 'form':
        return { label: 'Form-Index', unit: '', description: 'Gewichtete Performance der letzten Spiele' };
      default:
        return { label: 'Performance', unit: '', description: 'Allgemeine Performance-Metrik' };
    }
  }, [selectedMetric]);

  // Handle cell hover
  const handleCellHover = useCallback((period, team, event) => {
    const rect = event.target.getBoundingClientRect();
    setHoveredCell({
      period,
      team,
      data: period[`${team}_data`],
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
  }, []);

  const handleCellLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  if (loading) {
    return <LoadingSpinner message="Lade Performance-Heatmap..." />;
  }

  const metricInfo = getMetricInfo();

  return (
    <div className="team-performance-heatmap space-y-6">
      {/* Header and Controls */}
      <div className="modern-card">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-2 flex items-center gap-2">
              🔥 Performance-Heatmap
            </h2>
            <p className="text-text-secondary text-sm">
              {metricInfo.description} - {metricInfo.label} über Zeit visualisiert
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Time Range */}
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="modern-select"
            >
              <option value="1month">Letzter Monat</option>
              <option value="3months">Letzte 3 Monate</option>
              <option value="6months">Letzte 6 Monate</option>
              <option value="1year">Letztes Jahr</option>
            </select>

            {/* View Mode */}
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
              className="modern-select"
            >
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>

            {/* Team Selection */}
            <select 
              value={selectedTeam} 
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="modern-select"
            >
              <option value="both">Beide Teams</option>
              <option value="AEK">AEK</option>
              <option value="Real">Real</option>
            </select>

            {/* Metric Selection */}
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="modern-select"
            >
              <option value="winRate">Siegquote</option>
              <option value="goals">Tore pro Spiel</option>
              <option value="form">Form-Index</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="modern-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-text-primary">Legende</h3>
          <div className="text-sm text-text-secondary">
            {metricInfo.label} ({metricInfo.unit})
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Niedrig</span>
          {[1, 2, 3, 4, 5].map(intensity => (
            <div
              key={intensity}
              className={`w-6 h-6 rounded ${
                selectedMetric === 'winRate' || selectedMetric === 'form'
                  ? `heatmap-green-${intensity}`
                  : `heatmap-blue-${intensity}`
              }`}
            ></div>
          ))}
          <span className="text-sm text-text-secondary">Hoch</span>
          <div className="w-6 h-6 rounded bg-gray-100 ml-4"></div>
          <span className="text-sm text-text-secondary">Keine Daten</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="modern-card">
        <div className="heatmap-container overflow-x-auto">
          <div className="heatmap-grid" style={{ minWidth: `${heatmapData.periods.length * 80}px` }}>
            {/* Team Headers */}
            {selectedTeam === 'both' ? (
              <>
                {/* AEK Row */}
                <div className="heatmap-row">
                  <div className="heatmap-team-label">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="font-medium">AEK</span>
                    </div>
                  </div>
                  <div className="heatmap-cells">
                    {heatmapData.periods.map((period, index) => {
                      const teamData = period.AEK_data;
                      const cellColor = getCellColor(teamData?.value || 0, heatmapData.maxValue, heatmapData.minValue);
                      
                      return (
                        <div
                          key={`AEK-${index}`}
                          className={`heatmap-cell ${cellColor}`}
                          onMouseEnter={(e) => handleCellHover(period, 'AEK', e)}
                          onMouseLeave={handleCellLeave}
                          title={`${period.fullLabel}: ${teamData?.value?.toFixed(1) || '0'} ${metricInfo.unit}`}
                        >
                          <span className="sr-only">
                            AEK {period.fullLabel}: {teamData?.value?.toFixed(1) || '0'} {metricInfo.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real Row */}
                <div className="heatmap-row">
                  <div className="heatmap-team-label">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-white border"></div>
                      <span className="font-medium">Real</span>
                    </div>
                  </div>
                  <div className="heatmap-cells">
                    {heatmapData.periods.map((period, index) => {
                      const teamData = period.Real_data;
                      const cellColor = getCellColor(teamData?.value || 0, heatmapData.maxValue, heatmapData.minValue);
                      
                      return (
                        <div
                          key={`Real-${index}`}
                          className={`heatmap-cell ${cellColor}`}
                          onMouseEnter={(e) => handleCellHover(period, 'Real', e)}
                          onMouseLeave={handleCellLeave}
                          title={`${period.fullLabel}: ${teamData?.value?.toFixed(1) || '0'} ${metricInfo.unit}`}
                        >
                          <span className="sr-only">
                            Real {period.fullLabel}: {teamData?.value?.toFixed(1) || '0'} {metricInfo.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="heatmap-row">
                <div className="heatmap-team-label">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedTeam === 'AEK' ? 'bg-yellow-500' : 'bg-white border'}`}></div>
                    <span className="font-medium">{selectedTeam}</span>
                  </div>
                </div>
                <div className="heatmap-cells">
                  {heatmapData.periods.map((period, index) => {
                    const teamData = period[`${selectedTeam}_data`];
                    const cellColor = getCellColor(teamData?.value || 0, heatmapData.maxValue, heatmapData.minValue);
                    
                    return (
                      <div
                        key={`${selectedTeam}-${index}`}
                        className={`heatmap-cell ${cellColor}`}
                        onMouseEnter={(e) => handleCellHover(period, selectedTeam, e)}
                        onMouseLeave={handleCellLeave}
                        title={`${period.fullLabel}: ${teamData?.value?.toFixed(1) || '0'} ${metricInfo.unit}`}
                      >
                        <span className="sr-only">
                          {selectedTeam} {period.fullLabel}: {teamData?.value?.toFixed(1) || '0'} {metricInfo.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Period Labels */}
            <div className="heatmap-period-labels">
              <div className="heatmap-team-label"></div>
              <div className="heatmap-cells">
                {heatmapData.periods.map((period, index) => (
                  <div key={index} className="heatmap-period-label">
                    {period.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-bg-primary">
          <div className="text-center">
            <div className="text-lg font-semibold text-text-primary">
              {heatmapData.maxValue.toFixed(1)} {metricInfo.unit}
            </div>
            <div className="text-sm text-text-secondary">Höchstwert</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-text-primary">
              {((heatmapData.maxValue + heatmapData.minValue) / 2).toFixed(1)} {metricInfo.unit}
            </div>
            <div className="text-sm text-text-secondary">Durchschnitt</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-text-primary">
              {heatmapData.minValue.toFixed(1)} {metricInfo.unit}
            </div>
            <div className="text-sm text-text-secondary">Niedrigstwert</div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="heatmap-tooltip fixed z-50 bg-black bg-opacity-90 text-white p-3 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: hoveredCell.position.x - 100,
            top: hoveredCell.position.y - 80,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-medium mb-1">
            {hoveredCell.team} - {hoveredCell.period.fullLabel}
          </div>
          <div className="text-sm space-y-1">
            <div>
              {metricInfo.label}: {hoveredCell.data?.value?.toFixed(1) || '0'} {metricInfo.unit}
            </div>
            <div>
              Spiele: {hoveredCell.data?.matches || 0}
            </div>
            {hoveredCell.data?.details && (
              <div className="text-xs text-gray-300 mt-2">
                {hoveredCell.data.details}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Actions */}
      <div className="flex justify-center">
        <button
          onClick={() => onNavigate?.('matches')}
          className="modern-button-secondary"
        >
          Alle Spiele anzeigen
        </button>
      </div>
    </div>
  );
}

// Helper functions
function calculateTeamPerformance(matches, team, players, metric) {
  const teamPlayers = players.filter(p => p.team === team);
  const teamPlayerIds = teamPlayers.map(p => p.id);
  
  const teamMatches = matches.filter(match => {
    return team === 'AEK'
      ? match.aek_players?.some(pid => teamPlayerIds.includes(pid))
      : match.real_players?.some(pid => teamPlayerIds.includes(pid));
  });

  if (teamMatches.length === 0) {
    return { value: 0, matches: 0, details: 'Keine Spiele in diesem Zeitraum' };
  }

  switch (metric) {
    case 'winRate': {
      const wins = teamMatches.filter(match => {
        const aekScore = match.aek_score || 0;
        const realScore = match.real_score || 0;
        return team === 'AEK' ? aekScore > realScore : realScore > aekScore;
      }).length;
      
      const winRate = (wins / teamMatches.length) * 100;
      return {
        value: winRate,
        matches: teamMatches.length,
        details: `${wins} Siege von ${teamMatches.length} Spielen`
      };
    }
    
    case 'goals': {
      const totalGoals = teamMatches.reduce((sum, match) => {
        const goals = team === 'AEK' ? (match.aek_score || 0) : (match.real_score || 0);
        return sum + goals;
      }, 0);
      
      const avgGoals = totalGoals / teamMatches.length;
      return {
        value: avgGoals,
        matches: teamMatches.length,
        details: `${totalGoals} Tore in ${teamMatches.length} Spielen`
      };
    }
    
    case 'form': {
      // Calculate weighted form based on recent results
      let formScore = 0;
      teamMatches.forEach((match, index) => {
        const weight = (index + 1) / teamMatches.length; // More recent = higher weight
        const aekScore = match.aek_score || 0;
        const realScore = match.real_score || 0;
        
        let points = 0;
        if (team === 'AEK' ? aekScore > realScore : realScore > aekScore) {
          points = 3; // Win
        } else if (aekScore === realScore) {
          points = 1; // Draw
        }
        
        formScore += points * weight;
      });
      
      const maxPossibleScore = teamMatches.reduce((sum, _, index) => {
        return sum + (3 * (index + 1) / teamMatches.length);
      }, 0);
      
      const formIndex = maxPossibleScore > 0 ? (formScore / maxPossibleScore) * 100 : 0;
      
      return {
        value: formIndex,
        matches: teamMatches.length,
        details: `Form basierend auf gewichteten Ergebnissen`
      };
    }
    
    default:
      return { value: 0, matches: teamMatches.length, details: 'Unbekannte Metrik' };
  }
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}