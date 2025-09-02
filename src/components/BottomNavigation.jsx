const tabs = [
  { id: 'matches', icon: '⚽', label: 'Spiele', ariaLabel: 'Zu Spiele-Übersicht wechseln' },
  { id: 'bans', icon: '🚫', label: 'Bans', ariaLabel: 'Zu Bans-Übersicht wechseln' },
  { id: 'finanzen', icon: '€', label: 'Finanzen', ariaLabel: 'Zu Finanzen-Übersicht wechseln' },
  { id: 'squad', icon: '👥', label: 'Kader', ariaLabel: 'Zu Kader-Übersicht wechseln' },
  { id: 'ai', icon: '🤖', label: 'KI', ariaLabel: 'Zu KI-Assistent wechseln' },
  { id: 'stats', icon: '📊', label: 'Stats', ariaLabel: 'Zu Statistik-Übersicht wechseln' },
  { id: 'admin', icon: '⚙️', label: 'Verwaltung', ariaLabel: 'Zu Verwaltung wechseln' },
];

export default function BottomNavigation({ activeTab, onTabChange }) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-light shadow-lg z-50 safe-area-bottom"
      role="navigation"
      aria-label="Hauptnavigation"
    >
      <div className="flex items-center px-1 py-2 overflow-x-auto scrollbar-hide bottom-nav-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item flex flex-col items-center justify-center rounded-lg transition-all duration-200 hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-opacity-50 active:scale-95 touch-target flex-shrink-0 ${
              activeTab === tab.id ? 'active text-primary-green' : 'text-text-muted'
            }`}
            aria-label={tab.ariaLabel}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            style={{ minHeight: '56px', minWidth: '56px' }}
          >
            <div className="text-lg mb-1 select-none" aria-hidden="true">{tab.icon}</div>
            <span className="text-xs font-medium select-none text-center truncate max-w-[60px]">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}