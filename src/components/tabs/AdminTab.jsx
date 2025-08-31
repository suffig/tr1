import { useState } from 'react';
import BansTab from './BansTab';
import SpielerTab from './SpielerTab';

export default function AdminTab() {
  const [activeSubTab, setActiveSubTab] = useState('bans');

  const subTabs = [
    { id: 'bans', label: 'Sperren', icon: 'fas fa-ban' },
    { id: 'spieler', label: 'Spieler', icon: 'fas fa-star' },
  ];

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'bans':
        return <BansTab />;
      case 'spieler':
        return <SpielerTab />;
      default:
        return <BansTab />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab navigation */}
      <div className="bg-bg-secondary border-b border-border-light mb-4">
        <div className="flex">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSubTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-bg-primary'
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
      <div className="flex-1">
        {renderSubTabContent()}
      </div>
    </div>
  );
}