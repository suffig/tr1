import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import toast from 'react-hot-toast';

/**
 * NotificationSystem.jsx - Intelligente Push-Benachrichtigungen für Spiele, Achievements und System-Updates
 * Features:
 * - Browser-Benachrichtigungen mit Visual-Fallback
 * - Context-aware Nachrichten mit automatischer Gruppierung
 * - Real-time notifications with smart filtering
 */
export default function NotificationSystem({ onNavigate }) {
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fifa-tracker-dismissed-notifications') || '[]');
    } catch {
      return [];
    }
  });
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [isVisible, setIsVisible] = useState(true);

  // Fetch data for intelligent analysis
  const { data: matches } = useSupabaseQuery(
    'matches', 
    '*', 
    { order: { column: 'date', ascending: false } }
  );
  const { data: players } = useSupabaseQuery('players', '*');
  const { data: bans } = useSupabaseQuery('bans', '*');
  const { data: transactions } = useSupabaseQuery(
    'transactions', 
    '*', 
    { order: { column: 'date', ascending: false } }
  );
  const { data: finances } = useSupabaseQuery('finances', '*');

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('Browser-Benachrichtigungen aktiviert!');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  }, []);

  // Send browser notification with fallback
  const sendBrowserNotification = useCallback((notification) => {
    if (notificationPermission === 'granted' && typeof Notification !== 'undefined') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/assets/icon-180.png',
          badge: '/assets/icon-180.png',
          tag: notification.id,
          renotify: true,
          requireInteraction: notification.priority === 'high',
          data: {
            action: notification.action,
            actionLabel: notification.actionLabel,
            url: window.location.origin
          }
        });

        browserNotification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          if (notification.action) {
            notification.action();
          }
          browserNotification.close();
        };

        // Auto-close after 8 seconds for non-critical notifications
        if (notification.priority !== 'high') {
          setTimeout(() => browserNotification.close(), 8000);
        }
      } catch (error) {
        console.error('Failed to show browser notification:', error);
        // Fallback to toast
        showToastNotification(notification);
      }
    } else {
      // Fallback to toast notification
      showToastNotification(notification);
    }
  }, [notificationPermission]);

  // Show toast notification as fallback
  const showToastNotification = useCallback((notification) => {
    const toastOptions = {
      duration: notification.priority === 'high' ? 8000 : 4000,
      position: 'top-right',
      style: {
        background: getNotificationColor(notification.type),
        color: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        maxWidth: '400px',
      },
    };

    const message = (
      <div className="flex items-start gap-3">
        <span className="text-lg" role="img" aria-label={notification.type}>
          {notification.icon}
        </span>
        <div className="flex-1">
          <div className="font-semibold">{notification.title}</div>
          <div className="text-sm opacity-90 mt-1">{notification.message}</div>
          {notification.actionLabel && (
            <button
              onClick={notification.action}
              className="mt-2 text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full hover:bg-opacity-30 transition-colors"
            >
              {notification.actionLabel}
            </button>
          )}
        </div>
      </div>
    );

    toast.custom(message, toastOptions);
  }, []);

  // Get notification background color
  const getNotificationColor = useCallback((type) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  }, []);

  // Generate intelligent notifications with context awareness
  const notifications = useMemo(() => {
    if (!matches || !players || !bans || !transactions || !finances) return [];

    const alerts = [];
    const now = new Date();
    const today = now.toDateString();

    // 1. Match-related notifications
    if (matches.length > 0) {
      const recentMatches = matches.filter(match => {
        const matchDate = new Date(match.date);
        const daysDiff = (now - matchDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 1; // Last 24 hours
      });

      recentMatches.forEach(match => {
        alerts.push({
          id: `match-result-${match.id}`,
          type: 'success',
          priority: 'medium',
          icon: '⚽',
          title: 'Neues Spielergebnis',
          message: `${match.aek_score || 0}:${match.real_score || 0} - ${match.type || 'Freundschaftsspiel'}`,
          action: () => onNavigate?.('matches', { highlightMatch: match.id }),
          actionLabel: 'Spiel anzeigen',
          category: 'matches',
          timestamp: new Date(match.date)
        });
      });
    }

    // 2. Achievement notifications
    if (players.length > 0) {
      players.forEach(player => {
        const playerMatches = matches.filter(m => 
          m.aek_players?.includes(player.id) || m.real_players?.includes(player.id)
        );
        
        // Milestone achievements
        const milestoneCounts = [10, 25, 50, 100, 200];
        milestoneCounts.forEach(milestone => {
          if (playerMatches.length === milestone) {
            alerts.push({
              id: `achievement-${player.id}-${milestone}`,
              type: 'success',
              priority: 'high',
              icon: '🏆',
              title: 'Meilenstein erreicht!',
              message: `${player.name} hat ${milestone} Spiele erreicht!`,
              action: () => onNavigate?.('squad', { highlightPlayer: player.id }),
              actionLabel: 'Spieler anzeigen',
              category: 'achievements',
              timestamp: new Date()
            });
          }
        });
      });
    }

    // 3. Ban expiration warnings
    if (bans.length > 0) {
      bans.forEach(ban => {
        const remaining = (ban.totalgames || 0) - (ban.matchesserved || 0);
        if (remaining <= 2 && remaining > 0) {
          const player = players.find(p => p.id === ban.player_id);
          const playerName = player?.name || ban.player_name || 'Unbekannt';
          
          alerts.push({
            id: `ban-expiring-${ban.id}`,
            type: remaining === 1 ? 'warning' : 'info',
            priority: remaining === 1 ? 'high' : 'medium',
            icon: remaining === 1 ? '⚠️' : 'ℹ️',
            title: remaining === 1 ? 'Sperre läuft bald aus' : 'Sperre bald vorbei',
            message: `${playerName} - noch ${remaining} Spiel${remaining > 1 ? 'e' : ''}`,
            action: () => onNavigate?.('bans', { highlightBan: ban.id }),
            actionLabel: 'Sperren anzeigen',
            category: 'bans',
            timestamp: new Date()
          });
        }
      });
    }

    // 4. Financial alerts with smart thresholds
    if (finances.length > 0) {
      finances.forEach(finance => {
        const balance = finance.balance || 0;
        
        // Critical balance warnings
        if (balance < -50) {
          alerts.push({
            id: `finance-critical-${finance.team}`,
            type: 'error',
            priority: 'high',
            icon: '💸',
            title: 'Kritischer Kontostand',
            message: `${finance.team}: ${balance}€ - Sofortige Aufmerksamkeit erforderlich`,
            action: () => onNavigate?.('finanzen'),
            actionLabel: 'Finanzen verwalten',
            category: 'finances',
            timestamp: new Date()
          });
        } else if (balance < 0) {
          alerts.push({
            id: `finance-negative-${finance.team}`,
            type: 'warning',
            priority: 'medium',
            icon: '⚠️',
            title: 'Negativer Kontostand',
            message: `${finance.team}: ${balance}€`,
            action: () => onNavigate?.('finanzen'),
            actionLabel: 'Finanzen verwalten',
            category: 'finances',
            timestamp: new Date()
          });
        }
      });
    }

    // 5. System updates and maintenance
    const lastUpdateCheck = localStorage.getItem('fifa-tracker-last-update-check');
    const shouldCheckUpdates = !lastUpdateCheck || 
      (now - new Date(lastUpdateCheck)) > (24 * 60 * 60 * 1000); // 24 hours

    if (shouldCheckUpdates) {
      alerts.push({
        id: 'system-update-check',
        type: 'info',
        priority: 'low',
        icon: '🔄',
        title: 'System-Update verfügbar',
        message: 'Neue Features und Verbesserungen sind verfügbar',
        action: () => {
          localStorage.setItem('fifa-tracker-last-update-check', now.toISOString());
          window.location.reload();
        },
        actionLabel: 'Aktualisieren',
        category: 'system',
        timestamp: new Date()
      });
    }

    // Filter dismissed notifications
    return alerts.filter(alert => !dismissedNotifications.includes(alert.id));
  }, [matches, players, bans, transactions, finances, dismissedNotifications, onNavigate]);

  // Group notifications by category for better organization
  useEffect(() => {
    const grouped = notifications.reduce((acc, notification) => {
      const category = notification.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(notification);
      return acc;
    }, {});

    // Sort each category by priority and timestamp
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    });

    setGroupedNotifications(grouped);
  }, [notifications]);

  // Auto-send critical notifications
  useEffect(() => {
    const criticalNotifications = notifications.filter(n => 
      n.priority === 'high' && 
      !dismissedNotifications.includes(n.id)
    );

    criticalNotifications.forEach(notification => {
      sendBrowserNotification(notification);
    });
  }, [notifications, dismissedNotifications, sendBrowserNotification]);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId) => {
    const newDismissed = [...dismissedNotifications, notificationId];
    setDismissedNotifications(newDismissed);
    localStorage.setItem('fifa-tracker-dismissed-notifications', JSON.stringify(newDismissed));
  }, [dismissedNotifications]);

  // Clear all dismissed notifications (reset)
  const clearDismissedNotifications = useCallback(() => {
    setDismissedNotifications([]);
    localStorage.removeItem('fifa-tracker-dismissed-notifications');
  }, []);

  if (!isVisible || Object.keys(groupedNotifications).length === 0) {
    return null;
  }

  return (
    <div className="notification-system space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-text-primary">
            🔔 Benachrichtigungen
          </h3>
          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full hover:bg-blue-600 transition-colors"
            >
              Browser-Benachrichtigungen aktivieren
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearDismissedNotifications}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            title="Alle verworfenen Benachrichtigungen zurücksetzen"
          >
            ↺ Reset
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-lg text-text-secondary hover:text-text-primary transition-colors"
            title="Benachrichtigungen ausblenden"
          >
            ×
          </button>
        </div>
      </div>

      {/* Grouped notifications */}
      <div className="space-y-3">
        {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
          <div key={category} className="notification-group">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-medium text-text-secondary capitalize">
                {getCategoryLabel(category)}
              </h4>
              <span className="text-xs bg-bg-secondary text-text-secondary px-2 py-0.5 rounded-full">
                {categoryNotifications.length}
              </span>
            </div>
            
            <div className="space-y-2">
              {categoryNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item p-3 rounded-lg border-l-4 ${getNotificationStyles(notification)} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-lg flex-shrink-0" role="img" aria-label={notification.type}>
                        {notification.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-text-primary text-sm">
                          {notification.title}
                        </h5>
                        <p className="text-text-secondary text-xs mt-1 break-words">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {notification.actionLabel && (
                            <button
                              onClick={notification.action}
                              className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-primary-dark transition-colors"
                            >
                              {notification.actionLabel}
                            </button>
                          )}
                          <span className="text-xs text-text-secondary">
                            {notification.timestamp.toLocaleTimeString('de-DE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                      title="Benachrichtigung verwerfen"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper functions
function getCategoryLabel(category) {
  const labels = {
    matches: 'Spiele',
    achievements: 'Erfolge',
    bans: 'Sperren',
    finances: 'Finanzen',
    system: 'System',
    other: 'Andere'
  };
  return labels[category] || category;
}

function getNotificationStyles(notification) {
  const baseClasses = 'bg-bg-secondary';
  
  switch (notification.type) {
    case 'success':
      return `${baseClasses} border-green-500`;
    case 'warning':
      return `${baseClasses} border-yellow-500`;
    case 'error':
      return `${baseClasses} border-red-500`;
    case 'info':
      return `${baseClasses} border-blue-500`;
    default:
      return `${baseClasses} border-gray-500`;
  }
}