import { useState, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import BottomNavigation from './components/BottomNavigation';
import LoadingSpinner, { FullScreenLoader } from './components/LoadingSpinner';

// Lazy load tab components for better performance
const MatchesTab = lazy(() => import('./components/tabs/MatchesTab'));
// For now, we'll create placeholder components for other tabs
const PlaceholderTab = ({ tabName }) => (
  <div className="p-4 pb-20">
    <div className="text-center py-12">
      <div className="text-4xl mb-4">⚽</div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        {tabName} Tab
      </h3>
      <p className="text-text-muted">
        Diese Funktionalität wird gerade zu React migriert...
      </p>
    </div>
  </div>
);

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');
  const [tabLoading, setTabLoading] = useState(false);

  const handleTabChange = async (newTab) => {
    if (newTab === activeTab) return;
    
    setTabLoading(true);
    // Add small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 200));
    setActiveTab(newTab);
    setTabLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'matches':
        return <MatchesTab />;
      case 'squad':
        return <PlaceholderTab tabName="Kader" />;
      case 'bans':
        return <PlaceholderTab tabName="Sperren" />;
      case 'finanzen':
        return <PlaceholderTab tabName="Finanzen" />;
      case 'stats':
        return <PlaceholderTab tabName="Stats" />;
      case 'spieler':
        return <PlaceholderTab tabName="Spieler" />;
      default:
        return <MatchesTab />;
    }
  };

  if (authLoading) {
    return <FullScreenLoader message="Lade Anwendung..." />;
  }

  if (!user) {
    return (
      <>
        <Login />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#1E293B',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<LoadingSpinner message="Lade Tab..." />}>
          {tabLoading ? (
            <LoadingSpinner message="Wechsle Tab..." />
          ) : (
            renderTabContent()
          )}
        </Suspense>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#1E293B',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  );
}

export default App;