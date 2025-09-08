/**
 * Visibility Change Handler Hook for React
 * Handles app visibility changes with state management for reconnection
 */
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth.js';

export default function useVisibilityHandler() {
  const { user } = useAuth();
  const inactivityTimer = useRef(null);
  const wasVisible = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;

      if (!isVisible && wasVisible.current) {
        // App became hidden
        console.log('📱 App hidden - starting inactivity timer');
        
        // Start inactivity cleanup timer (5 minutes)
        inactivityTimer.current = setTimeout(() => {
          console.log('📱 App inactive for 5 minutes - cleaning up resources');
          
          // Dispatch custom event for components to clean up
          window.dispatchEvent(new CustomEvent('fifa-tracker-cleanup', {
            detail: { reason: 'inactivity' }
          }));
        }, 5 * 60 * 1000);
        
      } else if (isVisible && !wasVisible.current) {
        // App became visible
        console.log('📱 App visible - canceling inactivity timer');
        
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }

        // If user is authenticated, trigger data refresh
        if (user) {
          console.log('📱 App visible - refreshing data');
          
          // Dispatch custom event for components to refresh
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('fifa-tracker-refresh', {
              detail: { reason: 'visibility-restored' }
            }));
          }, 100);
        }
      }

      wasVisible.current = isVisible;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [user]);

  return {
    isVisible: !document.hidden
  };
}