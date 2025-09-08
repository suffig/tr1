import { useState, useEffect, useMemo } from 'react';

/**
 * EnhancedLoading.jsx - Skeleton-Screens mit Shimmer-Effekten
 * Features:
 * - Staggered Animationen für bessere visuelle Hierarchie
 * - Adaptive Loading-Zustände basierend auf Content-Typ
 * - iOS-style loading with sophisticated animations
 */

// Main Enhanced Loading Component
export default function EnhancedLoading({ 
  type = 'default',
  message = 'Lädt...',
  showMessage = true,
  duration = null,
  staggerDelay = 100,
  shimmerIntensity = 'medium'
}) {
  const [progress, setProgress] = useState(0);

  // Simulate loading progress if duration is specified
  useEffect(() => {
    if (!duration) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (duration / 100)); // Update every 100ms
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  const skeletonConfig = useMemo(() => {
    switch (type) {
      case 'player-list':
        return {
          items: Array.from({ length: 6 }, (_, i) => ({
            type: 'player-card',
            delay: i * staggerDelay
          }))
        };
      
      case 'match-list':
        return {
          items: Array.from({ length: 4 }, (_, i) => ({
            type: 'match-card',
            delay: i * staggerDelay
          }))
        };
      
      case 'dashboard':
        return {
          items: [
            { type: 'header', delay: 0 },
            { type: 'stats-grid', delay: staggerDelay },
            { type: 'chart', delay: staggerDelay * 2 },
            { type: 'table', delay: staggerDelay * 3 }
          ]
        };
      
      case 'financial':
        return {
          items: [
            { type: 'balance-card', delay: 0 },
            { type: 'transaction-list', delay: staggerDelay }
          ]
        };
      
      case 'profile':
        return {
          items: [
            { type: 'avatar', delay: 0 },
            { type: 'profile-info', delay: staggerDelay },
            { type: 'stats-cards', delay: staggerDelay * 2 }
          ]
        };
      
      default:
        return {
          items: [
            { type: 'text-line', delay: 0 },
            { type: 'text-line', delay: staggerDelay },
            { type: 'text-line', delay: staggerDelay * 2 }
          ]
        };
    }
  }, [type, staggerDelay]);

  return (
    <div className="enhanced-loading">
      {/* Progress Bar (if duration specified) */}
      {duration && (
        <div className="loading-progress mb-6">
          <div className="w-full bg-bg-secondary rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3B82F6, #60A5FA, #3B82F6)',
                backgroundSize: '200% 100%',
                animation: 'shimmer-progress 2s infinite'
              }}
            />
          </div>
          {showMessage && (
            <div className="text-center mt-2 text-sm text-text-secondary">
              {message} {Math.round(progress)}%
            </div>
          )}
        </div>
      )}

      {/* Skeleton Content */}
      <div className="skeleton-container space-y-4">
        {skeletonConfig.items.map((item, index) => (
          <SkeletonItem 
            key={index}
            type={item.type}
            delay={item.delay}
            shimmerIntensity={shimmerIntensity}
          />
        ))}
      </div>

      {/* Loading Message (if no progress) */}
      {!duration && showMessage && (
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-2">
            <LoadingSpinner size="small" />
            <span className="text-sm text-text-secondary">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Skeleton Item Component
function SkeletonItem({ type, delay = 0, shimmerIntensity = 'medium' }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const shimmerClass = `shimmer-${shimmerIntensity}`;
  const baseClasses = `skeleton-item transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`;

  switch (type) {
    case 'player-card':
      return (
        <div className={`${baseClasses} bg-bg-secondary rounded-lg p-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-skeleton ${shimmerClass}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 bg-skeleton rounded w-2/3 ${shimmerClass}`} />
              <div className={`h-3 bg-skeleton rounded w-1/2 ${shimmerClass}`} />
            </div>
            <div className={`w-8 h-8 rounded bg-skeleton ${shimmerClass}`} />
          </div>
        </div>
      );

    case 'match-card':
      return (
        <div className={`${baseClasses} bg-bg-secondary rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded bg-skeleton ${shimmerClass}`} />
              <div className={`h-6 bg-skeleton rounded w-16 ${shimmerClass}`} />
              <div className={`w-8 h-8 rounded bg-skeleton ${shimmerClass}`} />
            </div>
            <div className="space-y-1">
              <div className={`h-3 bg-skeleton rounded w-20 ${shimmerClass}`} />
              <div className={`h-3 bg-skeleton rounded w-16 ${shimmerClass}`} />
            </div>
          </div>
        </div>
      );

    case 'header':
      return (
        <div className={`${baseClasses} space-y-3`}>
          <div className={`h-8 bg-skeleton rounded w-1/3 ${shimmerClass}`} />
          <div className={`h-4 bg-skeleton rounded w-2/3 ${shimmerClass}`} />
        </div>
      );

    case 'stats-grid':
      return (
        <div className={`${baseClasses} grid grid-cols-2 lg:grid-cols-4 gap-4`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-bg-secondary rounded-lg p-4 space-y-2">
              <div className={`h-6 bg-skeleton rounded w-full ${shimmerClass}`} />
              <div className={`h-4 bg-skeleton rounded w-2/3 ${shimmerClass}`} />
            </div>
          ))}
        </div>
      );

    case 'chart':
      return (
        <div className={`${baseClasses} bg-bg-secondary rounded-lg p-6`}>
          <div className="space-y-4">
            <div className={`h-4 bg-skeleton rounded w-1/4 ${shimmerClass}`} />
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 bg-skeleton rounded-t ${shimmerClass}`}
                  style={{ height: `${Math.random() * 100 + 20}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      );

    case 'table':
      return (
        <div className={`${baseClasses} bg-bg-secondary rounded-lg overflow-hidden`}>
          {/* Table Header */}
          <div className="p-4 border-b border-bg-primary">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-4 bg-skeleton rounded ${shimmerClass}`} />
              ))}
            </div>
          </div>
          {/* Table Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-bg-primary last:border-b-0">
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className={`h-4 bg-skeleton rounded ${shimmerClass}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'balance-card':
      return (
        <div className={`${baseClasses} bg-bg-secondary rounded-lg p-6`}>
          <div className="space-y-4">
            <div className={`h-4 bg-skeleton rounded w-1/3 ${shimmerClass}`} />
            <div className={`h-10 bg-skeleton rounded w-2/3 ${shimmerClass}`} />
            <div className="grid grid-cols-2 gap-4">
              <div className={`h-6 bg-skeleton rounded ${shimmerClass}`} />
              <div className={`h-6 bg-skeleton rounded ${shimmerClass}`} />
            </div>
          </div>
        </div>
      );

    case 'transaction-list':
      return (
        <div className={`${baseClasses} space-y-3`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-bg-secondary rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-skeleton ${shimmerClass}`} />
                  <div className="space-y-1">
                    <div className={`h-4 bg-skeleton rounded w-24 ${shimmerClass}`} />
                    <div className={`h-3 bg-skeleton rounded w-16 ${shimmerClass}`} />
                  </div>
                </div>
                <div className={`h-4 bg-skeleton rounded w-12 ${shimmerClass}`} />
              </div>
            </div>
          ))}
        </div>
      );

    case 'avatar':
      return (
        <div className={`${baseClasses} text-center space-y-4`}>
          <div className={`w-20 h-20 rounded-full bg-skeleton mx-auto ${shimmerClass}`} />
          <div className="space-y-2">
            <div className={`h-6 bg-skeleton rounded w-32 mx-auto ${shimmerClass}`} />
            <div className={`h-4 bg-skeleton rounded w-24 mx-auto ${shimmerClass}`} />
          </div>
        </div>
      );

    case 'profile-info':
      return (
        <div className={`${baseClasses} bg-bg-secondary rounded-lg p-4 space-y-3`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className={`h-4 bg-skeleton rounded w-1/3 ${shimmerClass}`} />
              <div className={`h-4 bg-skeleton rounded w-1/4 ${shimmerClass}`} />
            </div>
          ))}
        </div>
      );

    case 'stats-cards':
      return (
        <div className={`${baseClasses} grid grid-cols-3 gap-3`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-secondary rounded-lg p-3 text-center space-y-2">
              <div className={`h-8 bg-skeleton rounded ${shimmerClass}`} />
              <div className={`h-3 bg-skeleton rounded w-2/3 mx-auto ${shimmerClass}`} />
            </div>
          ))}
        </div>
      );

    case 'text-line':
    default:
      return (
        <div className={`${baseClasses} space-y-2`}>
          <div className={`h-4 bg-skeleton rounded w-full ${shimmerClass}`} />
          <div className={`h-4 bg-skeleton rounded w-5/6 ${shimmerClass}`} />
        </div>
      );
  }
}

// Loading Spinner Component
export function LoadingSpinner({ size = 'medium', color = 'primary' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-text-secondary',
    white: 'text-white'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

// Pulsing Dots Loader
export function PulsingDots({ count = 3, size = 'medium', color = 'primary' }) {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-text-secondary',
    white: 'bg-white'
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );
}

// Loading Bar Component
export function LoadingBar({ progress = 0, showProgress = false, className = "" }) {
  return (
    <div className={`loading-bar ${className}`}>
      <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full relative"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer" />
        </div>
      </div>
      {showProgress && (
        <div className="text-center mt-2 text-sm text-text-secondary">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

// Full Screen Loader
export function FullScreenLoader({ message = "Lädt...", showProgress = false, progress = 0 }) {
  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-sm mx-auto p-6">
        {/* Main Spinner */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto">
            <LoadingSpinner size="large" />
          </div>
          {/* Outer ring */}
          <div className="absolute inset-0 w-20 h-20 mx-auto -mt-2 -ml-2 border-2 border-primary border-opacity-20 rounded-full animate-ping" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-text-primary">{message}</h3>
          {showProgress && (
            <LoadingBar progress={progress} showProgress={true} />
          )}
        </div>

        {/* Animated dots */}
        <PulsingDots count={3} size="medium" color="primary" />
      </div>
    </div>
  );
}

// Skeleton Card Wrapper
export function SkeletonCard({ children, loading = true, skeleton, className = "" }) {
  if (loading) {
    return (
      <div className={`skeleton-card ${className}`}>
        {skeleton || <EnhancedLoading type="default" showMessage={false} />}
      </div>
    );
  }

  return children;
}