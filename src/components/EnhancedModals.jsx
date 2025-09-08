import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

/**
 * EnhancedModals.jsx - Smooth Übergänge mit verschiedenen Animationen
 * Features:
 * - Bottom Sheets, Slide-Overs und Confirmation-Dialoge
 * - Keyboard-Navigation und Accessibility-Verbesserungen
 * - Enhanced modal system with smooth animations
 */

// Modal Context for managing multiple modals
const ModalContext = createContext({
  modals: [],
  openModal: () => {},
  closeModal: () => {},
  closeAllModals: () => {}
});

// Modal Provider
export function ModalProvider({ children }) {
  const [modals, setModals] = useState([]);

  const openModal = useCallback((modalConfig) => {
    const id = Math.random().toString(36).substr(2, 9);
    setModals(prev => [...prev, { ...modalConfig, id }]);
    return id;
  }, []);

  const closeModal = useCallback((id) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals }}>
      {children}
      <ModalRenderer modals={modals} closeModal={closeModal} />
    </ModalContext.Provider>
  );
}

// Hook to use modal context
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Modal Renderer
function ModalRenderer({ modals, closeModal }) {
  const portalTarget = useRef(null);

  useEffect(() => {
    if (!portalTarget.current) {
      portalTarget.current = document.createElement('div');
      portalTarget.current.id = 'modal-portal';
      document.body.appendChild(portalTarget.current);
    }

    return () => {
      if (portalTarget.current && portalTarget.current.parentNode) {
        portalTarget.current.parentNode.removeChild(portalTarget.current);
      }
    };
  }, []);

  if (!portalTarget.current) return null;

  return createPortal(
    <div className="modal-container">
      {modals.map((modal) => (
        <EnhancedModal
          key={modal.id}
          {...modal}
          onClose={() => closeModal(modal.id)}
        />
      ))}
    </div>,
    portalTarget.current
  );
}

// Main Enhanced Modal Component
export default function EnhancedModal({
  isOpen = true,
  onClose,
  type = 'center',
  size = 'medium',
  title,
  children,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  animation = 'fade',
  className = "",
  contentClassName = "",
  backdropClassName = ""
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      previousFocusRef.current = document.activeElement;
      
      // Focus the modal after animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 150);
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        
        // Restore focus
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onClose?.();
      }

      // Trap focus within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose?.();
    }
  }, [closeOnBackdrop, onClose]);

  const getModalClasses = useCallback(() => {
    const baseClasses = "fixed inset-0 z-50 flex";
    
    const typeClasses = {
      center: "items-center justify-center p-4",
      bottom: "items-end justify-center",
      top: "items-start justify-center p-4",
      left: "items-center justify-start",
      right: "items-center justify-end",
      fullscreen: "items-center justify-center"
    };

    return `${baseClasses} ${typeClasses[type]} ${className}`;
  }, [type, className]);

  const getContentClasses = useCallback(() => {
    const baseClasses = "relative bg-white rounded-lg shadow-xl overflow-hidden";
    
    const sizeClasses = {
      small: "max-w-sm w-full",
      medium: "max-w-md w-full",
      large: "max-w-lg w-full",
      xlarge: "max-w-2xl w-full",
      full: "w-full h-full",
      auto: "w-auto"
    };

    const typeSpecificClasses = {
      center: sizeClasses[size],
      bottom: "w-full max-w-md rounded-t-lg rounded-b-none",
      top: `${sizeClasses[size]} rounded-b-lg rounded-t-none`,
      left: "h-full w-80 rounded-r-lg rounded-l-none",
      right: "h-full w-80 rounded-l-lg rounded-r-none",
      fullscreen: "w-full h-full rounded-none"
    };

    return `${baseClasses} ${typeSpecificClasses[type]} ${contentClassName}`;
  }, [type, size, contentClassName]);

  const getAnimationClasses = useCallback(() => {
    const isEntering = isOpen && isAnimating;
    const isExiting = !isOpen && isAnimating;

    const animations = {
      fade: {
        entering: "animate-fade-in",
        exiting: "animate-fade-out",
        stable: "opacity-100"
      },
      scale: {
        entering: "animate-scale-in",
        exiting: "animate-scale-out",
        stable: "transform scale-100"
      },
      slideUp: {
        entering: "animate-slide-up",
        exiting: "animate-slide-down",
        stable: "transform translate-y-0"
      },
      slideDown: {
        entering: "animate-slide-down-in",
        exiting: "animate-slide-up-out",
        stable: "transform translate-y-0"
      },
      slideLeft: {
        entering: "animate-slide-left",
        exiting: "animate-slide-right-out",
        stable: "transform translate-x-0"
      },
      slideRight: {
        entering: "animate-slide-right",
        exiting: "animate-slide-left-out",
        stable: "transform translate-x-0"
      }
    };

    const animationSet = animations[animation] || animations.fade;

    if (isEntering) return animationSet.entering;
    if (isExiting) return animationSet.exiting;
    return animationSet.stable;
  }, [animation, isOpen, isAnimating]);

  if (!isVisible) return null;

  return (
    <div className={getModalClasses()} onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black transition-opacity duration-150
          ${isOpen && !isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}
          ${backdropClassName}
        `} 
      />
      
      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`${getContentClasses()} ${getAnimationClasses()}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Modal schließen"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Bottom Sheet Component
export function BottomSheet({
  isOpen = false,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  className = ""
}) {
  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      type="bottom"
      animation="slideUp"
      title={title}
      showCloseButton={false}
      className={className}
    >
      {showHandle && (
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
        </div>
      )}
      <div style={{ height: height === 'auto' ? 'auto' : height }}>
        {children}
      </div>
    </EnhancedModal>
  );
}

// Confirmation Dialog
export function ConfirmationDialog({
  isOpen = false,
  onClose,
  onConfirm,
  title = "Bestätigung",
  message,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  type = 'default', // 'default', 'danger', 'warning'
  loading = false
}) {
  const handleConfirm = useCallback(async () => {
    if (loading) return;
    
    try {
      await onConfirm?.();
      onClose?.();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  }, [loading, onConfirm, onClose]);

  const getButtonClasses = useCallback(() => {
    const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors";
    
    switch (type) {
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500`;
      default:
        return `${baseClasses} bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary`;
    }
  }, [type]);

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      type="center"
      size="small"
      animation="scale"
      title={title}
    >
      <div className="space-y-4">
        {message && (
          <p className="text-gray-600">{message}</p>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`${getButtonClasses()} disabled:opacity-50 flex items-center gap-2`}
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </EnhancedModal>
  );
}

// Slide Over Component
export function SlideOver({
  isOpen = false,
  onClose,
  side = 'right', // 'left' or 'right'
  title,
  children,
  width = 'md',
  className = ""
}) {
  const widthClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-1/3'
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      type={side}
      animation={side === 'right' ? 'slideLeft' : 'slideRight'}
      title={title}
      className={className}
      contentClassName={widthClasses[width]}
    >
      {children}
    </EnhancedModal>
  );
}

// Alert Dialog Component
export function AlertDialog({
  isOpen = false,
  onClose,
  title,
  message,
  type = 'info', // 'info', 'success', 'warning', 'error'
  okLabel = "OK"
}) {
  const getIcon = useCallback(() => {
    switch (type) {
      case 'success':
        return (
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  }, [type]);

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      type="center"
      size="small"
      animation="scale"
      title={title}
    >
      <div className="text-center">
        {getIcon()}
        {message && <p className="text-gray-600 mb-4">{message}</p>}
        <button
          onClick={onClose}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          {okLabel}
        </button>
      </div>
    </EnhancedModal>
  );
}

// Hook for managing modal state
export function useModalState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}