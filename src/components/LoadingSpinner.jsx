export default function LoadingSpinner({ message = 'Lädt...', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className={`spinner ${sizeClasses[size]}`}></div>
        <div className="text-sm text-text-muted font-medium">{message}</div>
      </div>
    </div>
  );
}

export function FullScreenLoader({ message = 'Lädt...' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-xl p-6 flex flex-col items-center gap-4 shadow-xl">
        <div className="spinner"></div>
        <div className="text-text-secondary font-medium">{message}</div>
      </div>
    </div>
  );
}