import { useState } from 'react';

const tabs = [
  { id: 'matches', icon: 'fas fa-futbol', label: 'Spiele' },
  { id: 'bans', icon: 'fas fa-ban', label: 'Bans' },
  { id: 'finanzen', icon: 'fas fa-euro-sign', label: 'Finanzen' },
  { id: 'squad', icon: 'fas fa-users', label: 'Kader' },
  { id: 'stats', icon: 'fas fa-chart-bar', label: 'Stats' },
  { id: 'admin', icon: 'fas fa-cog', label: 'Verwaltung' },
];

export default function BottomNavigation({ activeTab, onTabChange, onLogout }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-light shadow-lg z-50">
      <div className="flex justify-between items-center px-2 py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item flex-1 ${
              activeTab === tab.id ? 'active' : ''
            }`}
          >
            <i className={`${tab.icon} text-lg mb-1`}></i>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
        
        <button
          onClick={onLogout}
          className="nav-item flex-1 text-accent-red hover:text-accent-red"
          title="Abmelden"
        >
          <i className="fas fa-sign-out-alt text-lg mb-1"></i>
          <span className="text-xs">Logout</span>
        </button>
      </div>
    </nav>
  );
}