const tabs = [
  { id: 'matches', icon: '⚽', label: 'Spiele', ariaLabel: 'Zu Spiele-Übersicht wechseln' },
  { id: 'bans', icon: '🚫', label: 'Bans', ariaLabel: 'Zu Bans-Übersicht wechseln' },
  { id: 'finanzen', icon: '€', label: 'Finanzen', ariaLabel: 'Zu Finanzen-Übersicht wechseln' },
  { id: 'squad', icon: '👥', label: 'Kader', ariaLabel: 'Zu Kader-Übersicht wechseln' },
  { id: 'stats', icon: '📊', label: 'Stats', ariaLabel: 'Zu Statistik-Übersicht wechseln' },
  { id: 'admin', icon: '⚙️', label: 'Verwaltung', ariaLabel: 'Zu Verwaltung wechseln' },
];

export default function BottomNavigation({ activeTab, onTabChange }) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-light shadow-lg z-50"
      role="navigation"
      aria-label="Hauptnavigation"
    >
      <div className="flex justify-between items-center px-2 py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item flex-1 rounded-lg transition-all duration-200 hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-opacity-50 ${
              activeTab === tab.id ? 'active' : ''
            }`}
            aria-label={tab.ariaLabel}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <div className="text-lg mb-1" aria-hidden="true">{tab.icon}</div>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}