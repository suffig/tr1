import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * IOSComponents.jsx - Authentische iOS-Interface Elemente
 * Features:
 * - Toggle-Switches, Slider, Segmented Controls
 * - Action Sheets und Alert-Dialoge mit nativen Animationen
 * - iOS-style components with native feel
 */

// iOS Toggle Switch
export function IOSToggle({ 
  checked = false, 
  onChange, 
  disabled = false, 
  size = 'medium',
  color = 'primary',
  label,
  className = ""
}) {
  const sizeClasses = {
    small: 'w-10 h-6',
    medium: 'w-12 h-7',
    large: 'w-14 h-8'
  };

  const thumbSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const colorClasses = {
    primary: checked ? 'bg-primary' : 'bg-gray-300',
    green: checked ? 'bg-green-500' : 'bg-gray-300',
    blue: checked ? 'bg-blue-500' : 'bg-gray-300',
    red: checked ? 'bg-red-500' : 'bg-gray-300'
  };

  const handleToggle = useCallback(() => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  }, [checked, disabled, onChange]);

  return (
    <div className={`ios-toggle flex items-center gap-3 ${className}`}>
      {label && (
        <label className="text-text-primary font-medium select-none">
          {label}
        </label>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          relative inline-flex shrink-0 rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none 
          focus:ring-2 focus:ring-primary focus:ring-offset-2
        `}
      >
        <span
          className={`
            ${thumbSizes[size]}
            ${checked ? 'translate-x-full' : 'translate-x-0'}
            pointer-events-none inline-block rounded-full bg-white shadow-lg 
            transform ring-0 transition duration-200 ease-in-out
          `}
        />
      </button>
    </div>
  );
}

// iOS Slider
export function IOSSlider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  color = 'primary',
  showValue = false,
  label,
  className = ""
}) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const colorClasses = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500'
  };

  const handleChange = useCallback((newValue) => {
    if (disabled || !onChange) return;
    
    const clampedValue = Math.max(min, Math.min(max, newValue));
    const steppedValue = Math.round(clampedValue / step) * step;
    onChange(steppedValue);
  }, [min, max, step, disabled, onChange]);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    
    setIsDragging(true);
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newValue = min + (max - min) * percentage;
    handleChange(newValue);
  }, [disabled, min, max, handleChange]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || disabled) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newValue = min + (max - min) * percentage;
    handleChange(newValue);
  }, [isDragging, disabled, min, max, handleChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`ios-slider space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-text-primary font-medium">{label}</label>
          {showValue && (
            <span className="text-text-secondary text-sm">{value}</span>
          )}
        </div>
      )}
      <div 
        ref={sliderRef}
        className={`
          relative h-7 bg-gray-200 rounded-full cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Track Fill */}
        <div 
          className={`absolute top-0 left-0 h-full ${colorClasses[color]} rounded-full transition-all duration-150`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Thumb */}
        <div 
          className={`
            absolute top-1/2 w-7 h-7 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2
            transition-all duration-150 ${isDragging ? 'scale-110' : 'scale-100'}
            ${disabled ? '' : 'hover:scale-105'}
          `}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// iOS Segmented Control
export function IOSSegmentedControl({
  segments = [],
  selectedIndex = 0,
  onChange,
  disabled = false,
  color = 'primary',
  size = 'medium',
  className = ""
}) {
  const sizeClasses = {
    small: 'h-8 text-sm',
    medium: 'h-10 text-base',
    large: 'h-12 text-lg'
  };

  const colorClasses = {
    primary: 'bg-primary text-white',
    green: 'bg-green-500 text-white',
    blue: 'bg-blue-500 text-white',
    red: 'bg-red-500 text-white'
  };

  const handleSegmentClick = useCallback((index) => {
    if (!disabled && onChange && index !== selectedIndex) {
      onChange(index);
    }
  }, [disabled, onChange, selectedIndex]);

  return (
    <div className={`ios-segmented-control ${className}`}>
      <div className={`
        relative inline-flex bg-gray-200 rounded-lg p-1 ${sizeClasses[size]}
        ${disabled ? 'opacity-50' : ''}
      `}>
        {/* Selection Background */}
        <div 
          className={`
            absolute top-1 bottom-1 ${colorClasses[color]} rounded-md transition-all duration-200 ease-out
            shadow-sm
          `}
          style={{
            left: `${(selectedIndex / segments.length) * 100}%`,
            width: `${100 / segments.length}%`,
            marginLeft: '2px',
            marginRight: '2px'
          }}
        />
        
        {/* Segments */}
        {segments.map((segment, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => handleSegmentClick(index)}
            className={`
              relative flex-1 px-3 font-medium transition-colors duration-200 rounded-md
              ${selectedIndex === index ? 'text-white' : 'text-gray-700'}
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:text-gray-900'}
            `}
          >
            {typeof segment === 'string' ? segment : segment.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// iOS Action Sheet
export function IOSActionSheet({
  isOpen = false,
  onClose,
  title,
  message,
  actions = [],
  cancelLabel = "Abbrechen",
  className = ""
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleActionClick = useCallback((action) => {
    if (action.handler) {
      action.handler();
    }
    onClose?.();
  }, [onClose]);

  const handleCancelClick = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-end justify-center p-4
        ${isOpen ? 'animate-fade-in' : 'animate-fade-out'}
      `}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Action Sheet */}
      <div className={`
        relative w-full max-w-sm space-y-2
        ${isOpen ? 'animate-slide-up' : 'animate-slide-down'}
        ${className}
      `}>
        {/* Main Actions */}
        <div className="bg-white rounded-lg overflow-hidden">
          {(title || message) && (
            <div className="px-4 py-3 text-center border-b border-gray-200">
              {title && (
                <h3 className="font-semibold text-gray-900">{title}</h3>
              )}
              {message && (
                <p className="text-sm text-gray-600 mt-1">{message}</p>
              )}
            </div>
          )}
          
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={`
                w-full px-4 py-3 text-left font-medium border-b border-gray-200 last:border-b-0
                ${action.destructive ? 'text-red-600' : 'text-blue-600'}
                ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 active:bg-gray-100'}
                transition-colors duration-150
              `}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
        
        {/* Cancel Button */}
        <button
          onClick={handleCancelClick}
          className="w-full bg-white rounded-lg px-4 py-3 font-semibold text-blue-600 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

// iOS Alert Dialog
export function IOSAlert({
  isOpen = false,
  onClose,
  title,
  message,
  buttons = [],
  className = ""
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleButtonClick = useCallback((button) => {
    if (button.handler) {
      button.handler();
    }
    if (button.closeOnClick !== false) {
      onClose?.();
    }
  }, [onClose]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      // iOS alerts typically don't close on backdrop click
      // onClose?.();
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        ${isOpen ? 'animate-fade-in' : 'animate-fade-out'}
      `}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Alert Dialog */}
      <div className={`
        relative bg-white rounded-2xl w-full max-w-xs mx-auto overflow-hidden
        ${isOpen ? 'animate-scale-in' : 'animate-scale-out'}
        ${className}
      `}>
        {/* Content */}
        <div className="px-6 py-4 text-center">
          {title && (
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
          )}
          {message && (
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          )}
        </div>
        
        {/* Buttons */}
        {buttons.length > 0 && (
          <div className={`border-t border-gray-200 ${buttons.length > 2 ? 'space-y-px' : 'flex'}`}>
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(button)}
                className={`
                  px-6 py-3 font-medium text-blue-600 transition-colors duration-150
                  ${button.style === 'destructive' ? 'text-red-600' : ''}
                  ${button.style === 'cancel' ? 'font-normal text-gray-600' : ''}
                  ${button.style === 'default' ? 'font-semibold' : ''}
                  ${buttons.length <= 2 ? 'flex-1 border-r border-gray-200 last:border-r-0' : 'w-full border-b border-gray-200 last:border-b-0'}
                  hover:bg-gray-50 active:bg-gray-100
                `}
                disabled={button.disabled}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// iOS Button
export function IOSButton({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = "",
  ...props
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    ghost: "bg-transparent text-primary hover:bg-primary hover:bg-opacity-10 focus:ring-primary"
  };
  
  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    medium: "px-4 py-2.5 text-base",
    large: "px-6 py-3 text-lg"
  };

  const handleClick = useCallback((e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  }, [disabled, loading, onClick]);

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

// iOS Card
export function IOSCard({
  children,
  title,
  subtitle,
  padding = 'medium',
  shadow = true,
  className = ""
}) {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  return (
    <div className={`
      bg-white rounded-lg border border-gray-200
      ${shadow ? 'shadow-sm hover:shadow-md' : ''}
      ${paddingClasses[padding]}
      transition-shadow duration-200
      ${className}
    `}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// iOS List Item
export function IOSListItem({
  children,
  title,
  subtitle,
  leading,
  trailing,
  onClick,
  disabled = false,
  showChevron = false,
  className = ""
}) {
  const isClickable = onClick && !disabled;

  return (
    <div className={`
      flex items-center gap-3 p-3 bg-white border-b border-gray-200 last:border-b-0
      ${isClickable ? 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer' : ''}
      ${disabled ? 'opacity-50' : ''}
      transition-colors duration-150
      ${className}
    `}
    onClick={isClickable ? onClick : undefined}
    >
      {leading && <div className="flex-shrink-0">{leading}</div>}
      
      <div className="flex-1 min-w-0">
        {title && <div className="font-medium text-gray-900 truncate">{title}</div>}
        {subtitle && <div className="text-sm text-gray-600 truncate">{subtitle}</div>}
        {children}
      </div>
      
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
      
      {showChevron && (
        <div className="flex-shrink-0 text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}