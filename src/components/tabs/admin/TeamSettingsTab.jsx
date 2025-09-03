import { useState, useEffect } from 'react';

export default function TeamSettingsTab() {
  const [managers, setManagers] = useState({
    aek: { name: 'Alexander', age: 30, weight: 100 },
    real: { name: 'Philip', age: 30, weight: 105 }
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load manager settings from localStorage
  useEffect(() => {
    const savedManagers = localStorage.getItem('teamManagers');
    if (savedManagers) {
      try {
        setManagers(JSON.parse(savedManagers));
      } catch (e) {
        console.error('Error loading manager settings:', e);
      }
    }
  }, []);

  const handleManagerChange = (team, field, value) => {
    setManagers(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [field]: field === 'name' ? value : parseInt(value) || 0
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('teamManagers', JSON.stringify(managers));
      setHasChanges(false);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('managerSettingsChanged'));
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Manager-Einstellungen gespeichert!';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    } catch (error) {
      console.error('Error saving manager settings:', error);
      
      // Show error message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Fehler beim Speichern!';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    }
  };

  const resetToDefaults = () => {
    setManagers({
      aek: { name: 'Alexander', age: 30, weight: 100 },
      real: { name: 'Philip', age: 30, weight: 105 }
    });
    setHasChanges(true);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="modern-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            🏆 Team-Manager Einstellungen
          </h3>
          {hasChanges && (
            <span className="text-sm text-orange-600 font-medium">
              Ungespeicherte Änderungen
            </span>
          )}
        </div>
        
        <div className="text-sm text-text-muted mb-6">
          Hier können Sie die Daten der Team-Manager für die BAK-Berechnung anpassen.
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* AEK Manager */}
          <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="font-medium text-blue-800 flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded mr-2"></div>
              AEK Manager
            </h4>
            
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={managers.aek.name}
                onChange={(e) => handleManagerChange('aek', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Manager Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Alter</label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={managers.aek.age}
                  onChange={(e) => handleManagerChange('aek', 'age', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={managers.aek.weight}
                  onChange={(e) => handleManagerChange('aek', 'weight', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Real Manager */}
          <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-800 flex items-center">
              <div className="w-6 h-6 bg-red-600 rounded mr-2"></div>
              Real Manager
            </h4>
            
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={managers.real.name}
                onChange={(e) => handleManagerChange('real', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Manager Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Alter</label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={managers.real.age}
                  onChange={(e) => handleManagerChange('real', 'age', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={managers.real.weight}
                  onChange={(e) => handleManagerChange('real', 'weight', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Standardwerte wiederherstellen
          </button>
          
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              hasChanges 
                ? 'bg-primary-green text-white hover:bg-green-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Einstellungen speichern
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> Diese Einstellungen werden für die BAK-Berechnung in der Statistik verwendet.
            Die Werte sind nur lokal gespeichert und gelten für diesen Browser.
          </div>
        </div>
      </div>
    </div>
  );
}