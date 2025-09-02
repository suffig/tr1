import { useState } from 'react';
import AddMatchTab from './admin/AddMatchTab';
import AddBanTab from './admin/AddBanTab';
import AddPlayerTab from './admin/AddPlayerTab';
import AddTransactionTab from './admin/AddTransactionTab';

export default function AdminTab() {
  const [activeSubTab, setActiveSubTab] = useState('matches');

  const subTabs = [
    { id: 'matches', label: 'Spiele hinzufügen', icon: 'fas fa-futbol' },
    { id: 'bans', label: 'Sperren hinzufügen', icon: 'fas fa-ban' },
    { id: 'players', label: 'Spieler hinzufügen', icon: '👥' },
    { id: 'transactions', label: 'Transaktionen hinzufügen', icon: 'fas fa-euro-sign' },
  ];

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'matches':
        return <AddMatchTab />;
      case 'bans':
        return <AddBanTab />;
      case 'players':
        return <AddPlayerTab />;
      case 'transactions':
        return <AddTransactionTab />;
      default:
        return <AddMatchTab />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-bg-secondary border-b border-border-light">
        <h2 className="text-xl font-semibold text-text-primary mb-1">
          Verwaltung
        </h2>
        <p className="text-text-muted text-sm">
          Hinzufügen und verwalten von Daten
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="bg-bg-secondary border-b border-border-light">
        <div className="flex overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'text-primary-green border-b-2 border-primary-green bg-bg-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-y-auto">
        {renderSubTabContent()}
      </div>
    </div>
  );
}