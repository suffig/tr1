import { useState, useCallback, useEffect, useRef } from 'react';
import { ConfirmationDialog } from './EnhancedModals';

/**
 * EnhancedDeletion.jsx - Undo-Funktionalität mit 10-Sekunden Zeitfenster
 * Features:
 * - Fortschritts-Tracking für Batch-Operationen
 * - Intelligente Fehlerbehandlung mit benutzerfreundlichen Meldungen
 * - Enhanced deletion system with comprehensive undo support
 */
export default function EnhancedDeletion({
  onDelete,
  onUndo,
  items = [],
  undoTimeWindow = 10000, // 10 seconds
  batchSize = 5,
  confirmThreshold = 1,
  className = ""
}) {
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [completedDeletions, setCompletedDeletions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const timersRef = useRef(new Map());

  // Handle single item deletion
  const handleSingleDelete = useCallback(async (item) => {
    if (selectedItems.length > confirmThreshold) {
      setSelectedItems([item]);
      setShowConfirmation(true);
      return;
    }

    const deletionId = Math.random().toString(36).substr(2, 9);
    const deletionItem = {
      id: deletionId,
      originalItem: item,
      timestamp: Date.now(),
      status: 'pending'
    };

    setPendingDeletions(prev => [...prev, deletionItem]);

    // Set up undo timer
    const timer = setTimeout(async () => {
      try {
        await onDelete([item]);
        
        setPendingDeletions(prev => prev.filter(d => d.id !== deletionId));
        setCompletedDeletions(prev => [...prev, { ...deletionItem, status: 'completed' }]);
        
        timersRef.current.delete(deletionId);
      } catch (error) {
        console.error('Delete failed:', error);
        setError(`Fehler beim Löschen: ${error.message}`);
        
        setPendingDeletions(prev => prev.filter(d => d.id !== deletionId));
        timersRef.current.delete(deletionId);
      }
    }, undoTimeWindow);

    timersRef.current.set(deletionId, timer);
  }, [selectedItems.length, confirmThreshold, onDelete, undoTimeWindow]);

  // Handle batch deletion
  const handleBatchDelete = useCallback(async (itemsToDelete) => {
    if (itemsToDelete.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const batches = [];
      for (let i = 0; i < itemsToDelete.length; i += batchSize) {
        batches.push(itemsToDelete.slice(i, i + batchSize));
      }

      let processedCount = 0;

      for (const batch of batches) {
        const batchDeletions = batch.map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          originalItem: item,
          timestamp: Date.now(),
          status: 'pending'
        }));

        setPendingDeletions(prev => [...prev, ...batchDeletions]);

        // Set up batch timer
        const batchTimer = setTimeout(async () => {
          try {
            await onDelete(batch);
            
            setPendingDeletions(prev => 
              prev.filter(d => !batchDeletions.find(bd => bd.id === d.id))
            );
            setCompletedDeletions(prev => [
              ...prev, 
              ...batchDeletions.map(bd => ({ ...bd, status: 'completed' }))
            ]);

            batchDeletions.forEach(bd => timersRef.current.delete(bd.id));
          } catch (error) {
            console.error('Batch delete failed:', error);
            setError(`Batch-Löschung fehlgeschlagen: ${error.message}`);
            
            setPendingDeletions(prev => 
              prev.filter(d => !batchDeletions.find(bd => bd.id === d.id))
            );
            batchDeletions.forEach(bd => timersRef.current.delete(bd.id));
          }
        }, undoTimeWindow);

        batchDeletions.forEach(bd => {
          timersRef.current.set(bd.id, batchTimer);
        });

        processedCount += batch.length;
        setProgress((processedCount / itemsToDelete.length) * 100);

        // Small delay between batches to prevent overwhelming
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      setError(`Batch-Operation fehlgeschlagen: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setSelectedItems([]);
      setShowConfirmation(false);
    }
  }, [batchSize, onDelete, undoTimeWindow]);

  // Handle undo operation
  const handleUndo = useCallback(async (deletionId) => {
    const pendingDeletion = pendingDeletions.find(d => d.id === deletionId);
    if (!pendingDeletion) return;

    // Clear the timer
    const timer = timersRef.current.get(deletionId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(deletionId);
    }

    // Remove from pending deletions
    setPendingDeletions(prev => prev.filter(d => d.id !== deletionId));

    // Call undo callback if provided
    if (onUndo) {
      try {
        await onUndo(pendingDeletion.originalItem);
      } catch (error) {
        console.error('Undo failed:', error);
        setError(`Undo fehlgeschlagen: ${error.message}`);
      }
    }
  }, [pendingDeletions, onUndo]);

  // Handle bulk undo
  const handleUndoAll = useCallback(async () => {
    const allPendingIds = pendingDeletions.map(d => d.id);
    
    for (const id of allPendingIds) {
      await handleUndo(id);
    }
  }, [pendingDeletions, handleUndo]);

  // Clear completed deletions
  const clearCompleted = useCallback(() => {
    setCompletedDeletions([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className={`enhanced-deletion ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="error-banner bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">⚠️</span>
              <span className="text-red-800 font-medium">Fehler</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <div className="processing-banner bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="flex-1">
              <div className="text-blue-800 font-medium">Lösche Elemente...</div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-blue-600 text-sm mt-1">{Math.round(progress)}% abgeschlossen</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Deletions */}
      {pendingDeletions.length > 0 && (
        <div className="pending-deletions bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 text-lg">⏳</span>
              <span className="text-yellow-800 font-medium">
                Löschung geplant ({pendingDeletions.length})
              </span>
            </div>
            <button
              onClick={handleUndoAll}
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
            >
              Alle rückgängig
            </button>
          </div>

          <div className="space-y-2">
            {pendingDeletions.map((deletion) => (
              <PendingDeletionItem
                key={deletion.id}
                deletion={deletion}
                onUndo={() => handleUndo(deletion.id)}
                undoTimeWindow={undoTimeWindow}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Deletions Summary */}
      {completedDeletions.length > 0 && (
        <div className="completed-deletions bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">✅</span>
              <span className="text-green-800 font-medium">
                {completedDeletions.length} Element{completedDeletions.length > 1 ? 'e' : ''} gelöscht
              </span>
            </div>
            <button
              onClick={clearCompleted}
              className="text-sm text-green-600 hover:text-green-800 transition-colors"
            >
              Ausblenden
            </button>
          </div>
        </div>
      )}

      {/* Selection Actions */}
      {selectedItems.length > 0 && (
        <div className="selection-actions bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">
              {selectedItems.length} Element{selectedItems.length > 1 ? 'e' : ''} ausgewählt
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedItems([])}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Auswahl aufheben
              </button>
              <button
                onClick={() => {
                  if (selectedItems.length > confirmThreshold) {
                    setShowConfirmation(true);
                  } else {
                    handleBatchDelete(selectedItems);
                  }
                }}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                disabled={isProcessing}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item List */}
      <div className="item-list space-y-2">
        {items.map((item, index) => (
          <DeletableItem
            key={item.id || index}
            item={item}
            onDelete={() => handleSingleDelete(item)}
            onSelect={(selected) => {
              if (selected) {
                setSelectedItems(prev => [...prev, item]);
              } else {
                setSelectedItems(prev => prev.filter(i => i !== item));
              }
            }}
            isSelected={selectedItems.includes(item)}
            isPending={pendingDeletions.some(d => d.originalItem === item)}
            isProcessing={isProcessing}
          />
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={() => handleBatchDelete(selectedItems)}
        title="Löschung bestätigen"
        message={`Möchten Sie wirklich ${selectedItems.length} Element${selectedItems.length > 1 ? 'e' : ''} löschen? Diese Aktion kann innerhalb von ${undoTimeWindow / 1000} Sekunden rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        type="danger"
        loading={isProcessing}
      />
    </div>
  );
}

// Pending Deletion Item Component
function PendingDeletionItem({ deletion, onUndo, undoTimeWindow }) {
  const [timeLeft, setTimeLeft] = useState(undoTimeWindow);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - deletion.timestamp;
      const remaining = Math.max(0, undoTimeWindow - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deletion.timestamp, undoTimeWindow]);

  const progressPercent = (timeLeft / undoTimeWindow) * 100;

  return (
    <div className="pending-item bg-white rounded border p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {deletion.originalItem.name || deletion.originalItem.title || 'Element'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Wird in {Math.ceil(timeLeft / 1000)} Sekunden gelöscht
          </div>
        </div>
        <button
          onClick={onUndo}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          disabled={timeLeft === 0}
        >
          Rückgängig
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
        <div 
          className="bg-yellow-500 h-1 rounded-full transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
}

// Deletable Item Component
function DeletableItem({ 
  item, 
  onDelete, 
  onSelect, 
  isSelected, 
  isPending, 
  isProcessing 
}) {
  const handleSelect = useCallback((e) => {
    onSelect(e.target.checked);
  }, [onSelect]);

  return (
    <div className={`
      deletable-item flex items-center gap-3 p-3 bg-white border rounded-lg transition-all
      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
      ${isPending ? 'opacity-50' : ''}
      ${isProcessing ? 'pointer-events-none' : ''}
    `}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleSelect}
        disabled={isPending || isProcessing}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          {item.name || item.title || 'Unbenanntes Element'}
        </div>
        {item.description && (
          <div className="text-sm text-gray-500">{item.description}</div>
        )}
      </div>
      
      <button
        onClick={onDelete}
        disabled={isPending || isProcessing}
        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Element löschen"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// Hook for managing deletion state
export function useDeletion(options = {}) {
  const {
    undoTimeWindow = 10000,
    batchSize = 5,
    onDelete,
    onUndo
  } = options;

  const [deletionState, setDeletionState] = useState({
    pending: [],
    completed: [],
    errors: []
  });

  const deleteItems = useCallback(async (items) => {
    // Implementation would go here
    if (onDelete) {
      return await onDelete(items);
    }
  }, [onDelete]);

  const undoDelete = useCallback(async (item) => {
    if (onUndo) {
      return await onUndo(item);
    }
  }, [onUndo]);

  return {
    deletionState,
    deleteItems,
    undoDelete
  };
}