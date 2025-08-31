import { useState, Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import BottomNavigation from './components/BottomNavigation';
import LoadingSpinner, { FullScreenLoader } from './components/LoadingSpinner';

// Lazy load tab components for better performance
const MatchesTab = lazy(() => import('./components/tabs/MatchesTab'));
const KaderTab = lazy(() => import('./components/tabs/KaderTab'));
const BansTab = lazy(() => import('./components/tabs/BansTab'));
const FinanzenTab = lazy(() => import('./components/tabs/FinanzenTab'));
const StatsTab = lazy(() => import('./components/tabs/StatsTab'));
const AdminTab = lazy(() => import('./components/tabs/AdminTab'));

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');
  const [tabLoading, setTabLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check if we're in demo mode
  useEffect(() => {
    const checkDemoMode = () => {
      // Check if user has demo metadata or if there are demo-related console logs
      const demoMode = user?.user_metadata?.demo_mode || 
                       localStorage.getItem('supabase.auth.token')?.includes('demo-token');
      setIsDemoMode(demoMode);
    };
    
    checkDemoMode();
    
    // Listen for demo mode changes
    const interval = setInterval(checkDemoMode, 1000);
    return () => clearInterval(interval);
  }, [user]);

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
      case 'bans':
        return <BansTab />;
      case 'finanzen':
        return <FinanzenTab />;
      case 'squad':
        return <KaderTab />;
      case 'stats':
        return <StatsTab />;
      case 'admin':
        return <AdminTab />;
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
      {/* Connection Status Indicator */}
      {isDemoMode && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          <span className="inline-flex items-center">
            ⚠️ Demo-Modus aktiv - Supabase CDN blockiert
          </span>
        </div>
      )}
      
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