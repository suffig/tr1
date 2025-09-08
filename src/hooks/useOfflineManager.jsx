/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import useConnectionMonitor from './useConnectionMonitor.js';

/**
 * Offline Manager Hook for React - Enhanced with Connection Monitor
 * Provides comprehensive connectivity detection and status management
 */
export default function useOfflineManager() {
  const connectionMonitor = useConnectionMonitor();
  
  return { 
    isOnline: connectionMonitor.isConnected && connectionMonitor.networkOnline,
    wasOffline: !connectionMonitor.isConnected,
    connectionStatus: connectionMonitor.getStatus(),
    diagnostics: connectionMonitor.getDiagnostics(),
    isDatabaseAvailable: connectionMonitor.isDatabaseAvailable
  };
}

/**
 * Enhanced Offline Status Indicator Component
 * Shows detailed connection status with clickable diagnostics
 */
export function OfflineIndicator() {
  const { isOnline, connectionStatus, diagnostics } = useOfflineManager();
  const [showDetails, setShowDetails] = useState(false);

  if (isOnline && connectionStatus.connectionType !== 'fallback') return null;

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (connectionStatus.connectionType === 'fallback') return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (connectionStatus.connectionType === 'fallback') return 'Demo';
    return 'Reconnecting';
  };

  const getStatusTitle = () => {
    if (!isOnline) return 'Keine Verbindung - Klicken für Details';
    if (connectionStatus.connectionType === 'fallback') return 'Demo-Modus aktiv - Klicken für Details';
    return 'Verbindungsprobleme - Klicken für Details';
  };

  return (
    <>
      <div 
        className={`fixed top-3 right-3 z-50 px-3 py-1 rounded-full flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-105 ${getStatusColor()} text-white text-xs font-medium`}
        title={getStatusTitle()}
        onClick={() => setShowDetails(true)}
      >
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        {getStatusText()}
      </div>

      {/* Detailed Status Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Verbindungsstatus</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{getStatusText()}</div>
                    <div className="text-sm text-gray-600">
                      {connectionStatus.connectionType === 'fallback' ? 'Demo-Modus - Simulierte Daten' :
                       !isOnline ? 'Keine Internetverbindung' : 'Verbindungsprobleme'}
                    </div>
                  </div>
                </div>

                {/* Connection Metrics */}
                {connectionStatus.metrics && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Verbindungsmetriken</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Erfolgsrate: {connectionStatus.metrics.successRate}%</div>
                      <div>Antwortzeit: {Math.round(connectionStatus.metrics.averageResponseTime)}ms</div>
                      <div>Verbindungsversuche: {connectionStatus.metrics.totalConnections}</div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Empfehlungen</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {diagnostics.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Last Error */}
                {connectionStatus.lastError && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Letzter Fehler</h4>
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {connectionStatus.lastError.message}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

