import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * PullToRefresh.jsx - iOS-style Refresh mit Resistance-Kurve
 * Features:
 * - Haptic Feedback Simulation für Touch-Geräte
 * - Smart Cooldown-System zur Vermeidung von Spam-Requests
 * - iOS-style pull-to-refresh with resistance curve
 */
export default function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  resistanceRatio = 0.5,
  maxPullDistance = 120,
  cooldownTime = 2000,
  disabled = false,
  className = ""
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [canRefresh, setCanRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);
  
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const refreshTriggered = useRef(false);

  // Calculate pull distance with resistance curve
  const calculatePullDistance = useCallback((distance) => {
    if (distance <= 0) return 0;
    
    // Apply resistance using a curve function
    const resistance = Math.min(distance * resistanceRatio, maxPullDistance);
    return resistance * (1 - resistance / (maxPullDistance * 2));
  }, [resistanceRatio, maxPullDistance]);

  // Simulate haptic feedback
  const triggerHapticFeedback = useCallback((type = 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([10, 10, 20]);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  }, []);

  // Check if refresh is on cooldown
  const isOnCooldown = useCallback(() => {
    return Date.now() - lastRefresh < cooldownTime;
  }, [lastRefresh, cooldownTime]);

  // Handle refresh execution
  const executeRefresh = useCallback(async () => {
    if (!onRefresh || isOnCooldown() || isRefreshing) return;

    setIsRefreshing(true);
    setLastRefresh(Date.now());
    triggerHapticFeedback('medium');

    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      // Minimum refresh duration for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 500);
    }
  }, [onRefresh, isOnCooldown, isRefreshing, triggerHapticFeedback]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;

    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    isDragging.current = false;
    refreshTriggered.current = false;

    // Only start pulling if we're at the top of the container
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing || !isPulling) return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      isDragging.current = true;
      e.preventDefault(); // Prevent scrolling

      const newPullDistance = calculatePullDistance(deltaY);
      setPullDistance(newPullDistance);

      // Trigger haptic feedback at threshold
      if (newPullDistance >= refreshThreshold && !refreshTriggered.current) {
        triggerHapticFeedback('light');
        refreshTriggered.current = true;
      } else if (newPullDistance < refreshThreshold && refreshTriggered.current) {
        refreshTriggered.current = false;
      }
    }
  }, [disabled, isRefreshing, isPulling, calculatePullDistance, refreshThreshold, triggerHapticFeedback]);

  const handleTouchEnd = useCallback(() => {
    if (disabled || isRefreshing) return;

    setIsPulling(false);

    if (isDragging.current && pullDistance >= refreshThreshold && !isOnCooldown()) {
      executeRefresh();
    } else {
      // Smooth return to original position
      setPullDistance(0);
    }

    isDragging.current = false;
    refreshTriggered.current = false;
  }, [disabled, isRefreshing, pullDistance, refreshThreshold, isOnCooldown, executeRefresh]);

  // Mouse event handlers for desktop testing
  const handleMouseDown = useCallback((e) => {
    if (disabled || isRefreshing) return;

    startY.current = e.clientY;
    currentY.current = e.clientY;
    isDragging.current = false;
    refreshTriggered.current = false;

    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      setIsPulling(true);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [disabled, isRefreshing]);

  const handleMouseMove = useCallback((e) => {
    if (disabled || isRefreshing || !isPulling) return;

    currentY.current = e.clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      isDragging.current = true;
      e.preventDefault();

      const newPullDistance = calculatePullDistance(deltaY);
      setPullDistance(newPullDistance);

      if (newPullDistance >= refreshThreshold && !refreshTriggered.current) {
        refreshTriggered.current = true;
      } else if (newPullDistance < refreshThreshold && refreshTriggered.current) {
        refreshTriggered.current = false;
      }
    }
  }, [disabled, isRefreshing, isPulling, calculatePullDistance, refreshThreshold]);

  const handleMouseUp = useCallback(() => {
    if (disabled || isRefreshing) return;

    setIsPulling(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (isDragging.current && pullDistance >= refreshThreshold && !isOnCooldown()) {
      executeRefresh();
    } else {
      setPullDistance(0);
    }

    isDragging.current = false;
    refreshTriggered.current = false;
  }, [disabled, isRefreshing, pullDistance, refreshThreshold, isOnCooldown, executeRefresh, handleMouseMove]);

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Update cooldown status
  useEffect(() => {
    const updateCooldown = () => {
      setCanRefresh(!isOnCooldown());
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 100);
    return () => clearInterval(interval);
  }, [lastRefresh, isOnCooldown]);

  // Calculate refresh indicator progress
  const progress = Math.min(pullDistance / refreshThreshold, 1);
  const isAtThreshold = pullDistance >= refreshThreshold;

  return (
    <div 
      ref={containerRef}
      className={`pull-to-refresh relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Refresh Indicator */}
      <div 
        className={`
          absolute top-0 left-1/2 transform -translate-x-1/2 z-10
          transition-all duration-200 ease-out
          ${pullDistance > 0 ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          transform: `translateX(-50%) translateY(${Math.max(-50, pullDistance - 50)}px)`
        }}
      >
        <div className="flex flex-col items-center gap-2 p-4">
          {/* Spinner/Arrow */}
          <div className={`
            w-8 h-8 relative transition-transform duration-200
            ${isRefreshing ? 'animate-spin' : ''}
            ${isAtThreshold ? 'rotate-180' : `rotate-${Math.floor(progress * 180)}`}
          `}>
            {isRefreshing ? (
              <RefreshSpinner />
            ) : (
              <RefreshArrow 
                progress={progress}
                isAtThreshold={isAtThreshold}
              />
            )}
          </div>

          {/* Status Text */}
          <div className="text-xs text-center text-text-secondary font-medium">
            {isRefreshing ? (
              'Aktualisierung...'
            ) : !canRefresh ? (
              `Warte ${Math.ceil((cooldownTime - (Date.now() - lastRefresh)) / 1000)}s`
            ) : isAtThreshold ? (
              'Loslassen zum Aktualisieren'
            ) : (
              'Ziehen zum Aktualisieren'
            )}
          </div>

          {/* Progress Indicator */}
          <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`
                h-full transition-all duration-200
                ${isAtThreshold ? 'bg-green-500' : 'bg-primary'}
              `}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${pullDistance > 0 ? 'pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Cooldown Overlay */}
      {!canRefresh && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-200 z-20">
          <div 
            className="h-full bg-yellow-500 transition-all duration-100"
            style={{ 
              width: `${((cooldownTime - (Date.now() - lastRefresh)) / cooldownTime) * 100}%` 
            }}
          />
        </div>
      )}
    </div>
  );
}

// Refresh Spinner Component
function RefreshSpinner() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle
        className="text-gray-200"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="text-primary"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Refresh Arrow Component
function RefreshArrow({ progress, isAtThreshold }) {
  return (
    <svg 
      className={`w-full h-full transition-colors duration-200 ${
        isAtThreshold ? 'text-green-500' : 'text-primary'
      }`} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <path
        d="M12 2L8 6H11V14H13V6H16L12 2Z"
        fill="currentColor"
        style={{ opacity: Math.max(0.3, progress) }}
      />
      <path
        d="M20 18H4V20H20V18Z"
        fill="currentColor"
        style={{ opacity: progress * 0.5 }}
      />
    </svg>
  );
}

// Hook for managing refresh state
export function usePullToRefresh(refreshFunction, options = {}) {
  const {
    cooldownTime = 2000,
    enableAutoRefresh = false,
    autoRefreshInterval = 30000
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [error, setError] = useState(null);

  const canRefresh = Date.now() - lastRefresh >= cooldownTime;

  const refresh = useCallback(async () => {
    if (isRefreshing || !canRefresh) return false;

    setIsRefreshing(true);
    setError(null);
    setLastRefresh(Date.now());

    try {
      await refreshFunction();
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, canRefresh, refreshFunction]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(() => {
      if (!isRefreshing && canRefresh) {
        refresh();
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, autoRefreshInterval, refresh, isRefreshing, canRefresh]);

  return {
    refresh,
    isRefreshing,
    canRefresh,
    error,
    lastRefresh
  };
}

// Simple Pull to Refresh wrapper component
export function SimplePullToRefresh({ onRefresh, children, ...props }) {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      refreshThreshold={60}
      maxPullDistance={100}
      resistanceRatio={0.6}
      cooldownTime={1500}
      {...props}
    >
      {children}
    </PullToRefresh>
  );
}