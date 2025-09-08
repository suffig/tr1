/**
 * Enhanced Connection Monitor Hook for React
 * Provides sophisticated database connectivity monitoring, reconnection logic,
 * KeepAlive/Heartbeat, and comprehensive status reporting equivalent to vanilla JS version
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase, usingFallback } from '../utils/supabase.js';

// Interval for KeepAlive (default: 4 minutes)
const KEEPALIVE_INTERVAL = 4 * 60 * 1000;

export default function useConnectionMonitor() {
  const [connectionState, setConnectionState] = useState({
    isConnected: true,
    connectionType: 'unknown', // 'real', 'fallback', 'offline', 'unknown'
    reconnectAttempts: 0,
    lastError: null,
    isPaused: false,
    lastSuccessfulConnection: Date.now(),
    networkOnline: navigator.onLine,
    usingFallback: usingFallback
  });

  const [connectionMetrics, setConnectionMetrics] = useState({
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    averageResponseTime: 0,
    lastResponseTime: 0
  });

  // Configuration
  const config = useRef({
    maxReconnectAttempts: 5,
    reconnectDelay: 1000, // Start with 1 second
    maxReconnectDelay: 30000, // Max 30 seconds
    healthCheckInterval: 30000 // Check every 30 seconds
  });

  // Timers
  const timers = useRef({
    keepAlive: null,
    healthCheck: null,
    reconnect: null
  });

  // Update metrics
  const updateMetrics = useCallback((responseTime, success) => {
    setConnectionMetrics(prev => {
      const newMetrics = { ...prev };
      newMetrics.totalConnections++;
      newMetrics.lastResponseTime = responseTime;
      
      if (success) {
        newMetrics.successfulConnections++;
      } else {
        newMetrics.failedConnections++;
      }
      
      // Calculate rolling average
      if (newMetrics.totalConnections > 0) {
        newMetrics.averageResponseTime = 
          (prev.averageResponseTime * (prev.totalConnections - 1) + responseTime) / newMetrics.totalConnections;
      }
      
      return newMetrics;
    });
  }, []);

  // Detect connection type
  const detectConnectionType = useCallback(() => {
    if (usingFallback) {
      return 'fallback';
    } else if (!navigator.onLine) {
      return 'offline';
    } else {
      return 'real';
    }
  }, []);

  // Check connection with comprehensive error handling
  const checkConnection = useCallback(async () => {
    const startTime = performance.now();
    
    setConnectionMetrics(prev => ({
      ...prev,
      totalConnections: prev.totalConnections + 1
    }));

    try {
      // If using fallback mode, simulate successful connection with health metrics
      if (usingFallback) {
        const responseTime = Math.random() * 100 + 50; // Simulate 50-150ms response
        updateMetrics(responseTime, true);
        
        if (!connectionState.isConnected) {
          console.log('🔄 Demo mode - simulating connection restored');
          setConnectionState(prev => ({
            ...prev,
            isConnected: true,
            reconnectAttempts: 0,
            lastSuccessfulConnection: Date.now(),
            lastError: null,
            connectionType: 'fallback'
          }));
          
          toast.success('Demo-Modus aktiv - Simulierte Daten verfügbar', {
            duration: 3000,
            icon: '🔄'
          });
        }
        return true;
      }

      // Check network connectivity first
      if (!navigator.onLine) {
        throw new Error('Keine Internetverbindung');
      }

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        // Try a simple auth operation to test Supabase connectivity
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        
        if (error) {
          throw error;
        }

        const responseTime = performance.now() - startTime;
        updateMetrics(responseTime, true);

        if (!connectionState.isConnected) {
          console.log('✅ Database connection restored');
          setConnectionState(prev => ({
            ...prev,
            isConnected: true,
            reconnectAttempts: 0,
            lastSuccessfulConnection: Date.now(),
            lastError: null,
            connectionType: 'real'
          }));
          
          toast.success('Datenbankverbindung wiederhergestellt', {
            duration: 3000,
            icon: '✅'
          });
        }

        return true;
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          throw new Error('Verbindungstest-Timeout (> 10s)');
        }
        throw abortError;
      }

    } catch (error) {
      const responseTime = performance.now() - startTime;
      updateMetrics(responseTime, false);
      
      console.warn('❌ Database connection check failed:', error.message);

      if (connectionState.isConnected) {
        console.log('📴 Database connection lost');
        
        const newConnectionType = error.message.includes('Internetverbindung') ? 'offline' : 'disconnected';
        
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          connectionType: newConnectionType,
          lastError: error
        }));
        
        toast.error(getErrorMessage(error), {
          duration: 5000,
          icon: '❌'
        });
      }

      return false;
    }
  }, [connectionState.isConnected, updateMetrics]);

  // Get error message with German localization
  const getErrorMessage = (error) => {
    if (!error) return 'Unbekannter Fehler';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('internetverbindung') || message.includes('network')) {
      return 'Keine Internetverbindung';
    } else if (message.includes('timeout')) {
      return 'Verbindungs-Timeout - Server antwortet nicht';
    } else if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Authentifizierungsfehler - Bitte neu anmelden';
    } else if (message.includes('cdn') || message.includes('blocked')) {
      return 'CDN blockiert - Fallback-Modus wird verwendet';
    } else {
      return `Datenbankfehler: ${error.message}`;
    }
  };

  // Attempt reconnection with exponential backoff
  const attemptReconnection = useCallback(async () => {
    if (connectionState.isPaused) {
      console.log('⏸️ Skipping reconnection attempt - monitor is paused');
      return;
    }

    if (connectionState.reconnectAttempts >= config.current.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      
      toast.error('Maximale Wiederverbindungsversuche erreicht - Warte länger...', {
        duration: 10000,
        icon: '❌'
      });

      // Wait longer before trying again, then reset attempts
      timers.current.reconnect = setTimeout(() => {
        if (!connectionState.isPaused) {
          console.log('🔄 Resetting reconnection attempts after extended wait');
          setConnectionState(prev => ({
            ...prev,
            reconnectAttempts: 0
          }));
          config.current.reconnectDelay = 1000; // Reset delay
          attemptReconnection();
        }
      }, config.current.maxReconnectDelay);

      return;
    }

    setConnectionState(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));

    console.log(`🔄 Attempting to reconnect (${connectionState.reconnectAttempts + 1}/${config.current.maxReconnectAttempts})`);

    // For offline scenarios, check network first
    if (!navigator.onLine) {
      console.log('📴 Network is offline, waiting for network recovery...');
      
      toast.loading('Warte auf Netzwerkverbindung...', {
        duration: 5000,
        icon: '📴'
      });
      
      // Don't count offline checks against reconnect attempts
      setConnectionState(prev => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts - 1
      }));
      
      timers.current.reconnect = setTimeout(() => {
        if (!connectionState.isPaused) {
          attemptReconnection();
        }
      }, 5000); // Check network every 5 seconds
      return;
    }

    const connected = await checkConnection();

    if (!connected && !connectionState.isPaused) {
      // Exponential backoff with jitter
      const baseDelay = Math.min(config.current.reconnectDelay * 2, config.current.maxReconnectDelay);
      const jitter = Math.random() * 0.3 * baseDelay; // 30% jitter
      config.current.reconnectDelay = baseDelay + jitter;

      toast.loading(`Wiederverbindung... (${connectionState.reconnectAttempts + 1}/${config.current.maxReconnectAttempts})`, {
        duration: config.current.reconnectDelay,
        icon: '🔄'
      });

      timers.current.reconnect = setTimeout(() => {
        if (!connectionState.isPaused) {
          attemptReconnection();
        }
      }, config.current.reconnectDelay);
    }
  }, [connectionState.isPaused, connectionState.reconnectAttempts, checkConnection]);

  // Start health check
  const startHealthCheck = useCallback(() => {
    if (timers.current.healthCheck) {
      clearInterval(timers.current.healthCheck);
    }

    timers.current.healthCheck = setInterval(async () => {
      if (connectionState.isPaused || !connectionState.isConnected) {
        return;
      }

      const connected = await checkConnection();
      if (!connected) {
        attemptReconnection();
      }
    }, config.current.healthCheckInterval);
  }, [connectionState.isPaused, connectionState.isConnected, checkConnection, attemptReconnection]);

  // KeepAlive mechanism
  const startKeepAlive = useCallback(() => {
    if (timers.current.keepAlive) {
      clearInterval(timers.current.keepAlive);
    }

    timers.current.keepAlive = setInterval(async () => {
      if (connectionState.isPaused || !connectionState.isConnected || usingFallback) {
        return;
      }

      try {
        // Simple keepalive operation
        await supabase.auth.getSession();
        console.log('💓 KeepAlive heartbeat sent');
      } catch (error) {
        console.warn('💔 KeepAlive failed:', error.message);
      }
    }, KEEPALIVE_INTERVAL);
  }, [connectionState.isPaused, connectionState.isConnected]);

  // Pause/Resume functionality
  const pauseHealthChecks = useCallback(() => {
    setConnectionState(prev => ({ ...prev, isPaused: true }));
    if (timers.current.healthCheck) clearInterval(timers.current.healthCheck);
    if (timers.current.keepAlive) clearInterval(timers.current.keepAlive);
    console.log('⏸️ Connection monitoring paused');
  }, []);

  const resumeHealthChecks = useCallback(() => {
    setConnectionState(prev => ({ ...prev, isPaused: false }));
    startHealthCheck();
    startKeepAlive();
    console.log('▶️ Connection monitoring resumed');
  }, [startHealthCheck, startKeepAlive]);

  // Get comprehensive status
  const getStatus = useCallback(() => {
    return {
      ...connectionState,
      timeSinceLastConnection: Date.now() - connectionState.lastSuccessfulConnection,
      metrics: {
        ...connectionMetrics,
        successRate: connectionMetrics.totalConnections > 0 
          ? Math.round((connectionMetrics.successfulConnections / connectionMetrics.totalConnections) * 100)
          : 0
      },
      networkOnline: navigator.onLine,
      usingFallback: usingFallback
    };
  }, [connectionState, connectionMetrics]);

  // Get diagnostics
  const getDiagnostics = useCallback(() => {
    const status = getStatus();
    return {
      ...status,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connectionSpeed: connectionMetrics.averageResponseTime === 0 ? 'unknown' : 
        connectionMetrics.averageResponseTime < 100 ? 'fast' :
        connectionMetrics.averageResponseTime < 500 ? 'medium' :
        connectionMetrics.averageResponseTime < 1000 ? 'slow' : 'very-slow',
      recommendations: getRecommendations()
    };
  }, [getStatus, connectionMetrics]);

  // Get recommendations
  const getRecommendations = useCallback(() => {
    const recommendations = [];
    
    if (!connectionState.isConnected) {
      if (!navigator.onLine) {
        recommendations.push('Überprüfen Sie Ihre Internetverbindung');
      } else if (connectionState.connectionType === 'fallback') {
        recommendations.push('CDN ist blockiert - Demo-Modus wird verwendet');
        recommendations.push('Konfigurieren Sie Supabase-Credentials für echte Datenbankverbindung');
      } else if (connectionState.connectionType === 'expired') {
        recommendations.push('Melden Sie sich erneut an');
      } else {
        recommendations.push('Server temporär nicht erreichbar - Wiederverbindung läuft...');
      }
    }
    
    if (connectionMetrics.averageResponseTime > 2000) {
      recommendations.push('Langsame Verbindung erkannt - Überprüfen Sie Ihre Netzwerkgeschwindigkeit');
    }
    
    if (connectionMetrics.failedConnections > 5) {
      recommendations.push('Häufige Verbindungsfehler - Überprüfen Sie Ihre Netzwerkstabilität');
    }
    
    return recommendations;
  }, [connectionState, connectionMetrics]);

  // Setup network listeners and initialize
  useEffect(() => {
    // Detect initial connection type
    setConnectionState(prev => ({
      ...prev,
      connectionType: detectConnectionType()
    }));

    // Network event listeners
    const handleOnline = () => {
      setConnectionState(prev => ({ ...prev, networkOnline: true }));
      console.log('🌐 Network came online');
      checkConnection();
    };

    const handleOffline = () => {
      setConnectionState(prev => ({ 
        ...prev, 
        networkOnline: false,
        isConnected: false,
        connectionType: 'offline'
      }));
      console.log('📴 Network went offline');
    };

    // Page visibility change listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 App hidden - reducing health check frequency');
        config.current.healthCheckInterval = 60000; // Check every minute when hidden
      } else {
        console.log('📱 App visible - resuming normal health checks');
        config.current.healthCheckInterval = 30000; // Check every 30 seconds when visible
        startHealthCheck(); // Restart with new interval
        
        // Check connection immediately when app becomes visible
        if (!connectionState.isPaused) {
          checkConnection();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start monitoring
    startHealthCheck();
    startKeepAlive();

    return () => {
      // Cleanup
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timers.current.healthCheck) clearInterval(timers.current.healthCheck);
      if (timers.current.keepAlive) clearInterval(timers.current.keepAlive);
      if (timers.current.reconnect) clearTimeout(timers.current.reconnect);
    };
  }, [startHealthCheck, startKeepAlive, checkConnection, detectConnectionType]);

  return {
    // State
    ...connectionState,
    metrics: connectionMetrics,
    
    // Methods
    checkConnection,
    pauseHealthChecks,
    resumeHealthChecks,
    getStatus,
    getDiagnostics,
    getRecommendations,
    
    // Utility
    isDatabaseAvailable: () => usingFallback || connectionState.isConnected
  };
}