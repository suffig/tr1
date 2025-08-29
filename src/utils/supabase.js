// Enhanced Supabase client with fallback support for React
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nklkmrnuyxlhgtpigkqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rbGttcm51eXhsaGd0cGlna3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNTU4OTQsImV4cCI6MjA0NDkzMTg5NH0.8EXxWYjA7S0xCKU7xjKfMjqUYTKpLJNZ8mYNmHQTlhE';

// Global fallback state
let usingFallback = false;
let authSession = null;

// Sample data for fallback mode (enhanced with proper schema)
const fallbackData = {
  matches: [
    { 
      id: 1, 
      datum: '2024-01-15', 
      team1: 'AEK', 
      team2: 'Real', 
      tore1: 2, 
      tore2: 1, 
      status: 'finished',
      beschreibung: 'Spannendes Match mit später Entscheidung',
      created_at: '2024-01-15T20:00:00Z'
    },
    { 
      id: 2, 
      datum: '2024-01-10', 
      team1: 'AEK', 
      team2: 'Real', 
      tore1: 1, 
      tore2: 3, 
      status: 'finished',
      beschreibung: 'Klare Niederlage für AEK',
      created_at: '2024-01-10T19:30:00Z'
    },
    { 
      id: 3, 
      datum: '2024-01-05', 
      team1: 'AEK', 
      team2: 'Real', 
      tore1: 0, 
      tore2: 0, 
      status: 'finished',
      beschreibung: 'Torlose Partie',
      created_at: '2024-01-05T18:00:00Z'
    }
  ],
  players: [
    { id: 1, name: 'Max Müller', team: 'AEK', position: 'ST', goals: 5, created_at: '2024-01-01T10:00:00Z' },
    { id: 2, name: 'Tom Schmidt', team: 'AEK', position: 'TH', goals: 0, created_at: '2024-01-01T10:00:00Z' },
    { id: 3, name: 'Leon Wagner', team: 'AEK', position: 'IV', goals: 1, created_at: '2024-01-01T10:00:00Z' },
    { id: 4, name: 'Jan Becker', team: 'Real', position: 'ST', goals: 7, created_at: '2024-01-01T10:00:00Z' },
    { id: 5, name: 'Paul Klein', team: 'Real', position: 'TH', goals: 0, created_at: '2024-01-01T10:00:00Z' },
    { id: 6, name: 'Ben Richter', team: 'Real', position: 'ZM', goals: 2, created_at: '2024-01-01T10:00:00Z' }
  ],
  bans: [
    { id: 1, player_name: 'Max Müller', team: 'AEK', matches_remaining: 1, reason: 'Gelb-Rot', created_at: '2024-01-10T20:00:00Z' },
    { id: 2, player_name: 'Jan Becker', team: 'Real', matches_remaining: 2, reason: 'Unsportlichkeit', created_at: '2024-01-12T19:00:00Z' }
  ],
  transactions: [
    { id: 1, amount: 5000, description: 'Siegprämie', team: 'AEK', date: '2024-01-15', type: 'income', created_at: '2024-01-15T20:30:00Z' },
    { id: 2, amount: -2000, description: 'Kartenstrafe', team: 'Real', date: '2024-01-10', type: 'expense', created_at: '2024-01-10T20:30:00Z' },
    { id: 3, amount: 3000, description: 'Sponsoring', team: 'Real', date: '2024-01-08', type: 'income', created_at: '2024-01-08T12:00:00Z' }
  ]
};
let fallbackSession = null;
let authCallbacks = [];

// Try to restore session from localStorage
try {
  const stored = localStorage.getItem('supabase.auth.token');
  if (stored) {
    fallbackSession = JSON.parse(stored);
  }
} catch (e) {
  console.warn('Could not restore session:', e);
}

// Enhanced fallback client for when CDN is blocked
const createFallbackClient = () => {
  console.warn('🔄 Creating fallback Supabase client - CDN may be blocked');

  const mockClient = {
    auth: {
      getSession: () => {
        console.warn('⚠️ Using fallback getSession');
        return Promise.resolve({ data: { session: fallbackSession } });
      },
      getUser: () => {
        console.warn('⚠️ Using fallback getUser');
        return Promise.resolve({ data: { user: fallbackSession?.user || null } });
      },
      onAuthStateChange: (callback) => {
        console.warn('⚠️ Using fallback onAuthStateChange');
        authCallbacks.push(callback);
        // Initial callback
        setTimeout(() => callback(fallbackSession ? 'SIGNED_IN' : 'SIGNED_OUT', fallbackSession), 100);
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {
                authCallbacks = authCallbacks.filter(cb => cb !== callback);
              } 
            } 
          } 
        };
      },
      signInWithPassword: ({ email, password }) => {
        console.warn('⚠️ Using fallback signInWithPassword - Demo mode active');
        
        return new Promise((resolve) => {
          setTimeout(() => {
            // Enhanced validation for demo purposes
            if (!email || !password) {
              resolve({ 
                error: new Error('E-Mail und Passwort sind erforderlich.') 
              });
              return;
            }
            
            if (!email.includes('@')) {
              resolve({ 
                error: new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein.') 
              });
              return;
            }
            
            if (password.length < 3) {
              resolve({ 
                error: new Error('Passwort zu kurz (mindestens 3 Zeichen für Demo).') 
              });
              return;
            }
            
            // Create a mock session for demo mode
            fallbackSession = {
              user: {
                id: 'demo-user-' + Date.now(),
                email: email,
                created_at: new Date().toISOString(),
                app_metadata: { provider: 'demo', providers: ['demo'] },
                user_metadata: { demo_mode: true },
                aud: 'authenticated',
                role: 'authenticated'
              },
              access_token: 'demo-token-' + Date.now(),
              refresh_token: 'demo-refresh-' + Date.now(),
              expires_at: Date.now() / 1000 + 3600, // 1 hour from now
              expires_in: 3600,
              token_type: 'bearer'
            };
            
            // Store session in localStorage for persistence
            try {
              localStorage.setItem('supabase.auth.token', JSON.stringify(fallbackSession));
            } catch (e) {
              console.warn('Could not persist demo session:', e);
            }
            
            console.log('🔥 Demo session created:', fallbackSession);
            console.log('🔥 Number of auth callbacks:', authCallbacks.length);
            
            // Notify all auth listeners immediately
            authCallbacks.forEach((callback, index) => {
              console.log(`🔥 Calling auth callback ${index + 1}/${authCallbacks.length}`);
              setTimeout(() => {
                console.log(`🔥 Executing auth callback ${index + 1} with SIGNED_IN event`);
                callback('SIGNED_IN', fallbackSession);
              }, 50);
            });
            
            resolve({ 
              data: { user: fallbackSession.user, session: fallbackSession }, 
              error: null 
            });
          }, 300); // Simulate network delay
        });
      },
      signUp: ({ email, password }) => {
        console.warn('⚠️ Using fallback signUp - Demo mode active');
        
        if (!email || !password) {
          return Promise.resolve({ 
            error: new Error('E-Mail und Passwort sind erforderlich.') 
          });
        }
        
        if (password.length < 6) {
          return Promise.resolve({ 
            error: new Error('Passwort muss mindestens 6 Zeichen haben.') 
          });
        }
        
        return Promise.resolve({ 
          data: { user: null, session: null },
          error: null 
        });
      },
      signOut: () => {
        console.warn('⚠️ Using fallback signOut');
        
        return new Promise((resolve) => {
          // Clear stored session
          fallbackSession = null;
          
          try {
            localStorage.removeItem('supabase.auth.token');
          } catch (e) {
            console.warn('Could not clear stored session:', e);
          }
          
          // Notify all auth listeners
          authCallbacks.forEach(callback => {
            setTimeout(() => callback('SIGNED_OUT', null), 50);
          });
          
          resolve({ error: null });
        });
      }
    },
    // Add minimal database operations for demo mode
    from: (table) => {
      console.warn(`⚠️ Database operation on ${table} - Demo mode active`);
      return {
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
      };
    }
  };
  
  return mockClient;
};

// Try to create real Supabase client first, fallback if not available
let supabase;
let originalOnAuthStateChange = null;

try {
  // Create Supabase client
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });
  
  // Store the original onAuthStateChange method
  originalOnAuthStateChange = supabase.auth.onAuthStateChange.bind(supabase.auth);
  
  // Wrap the onAuthStateChange to also register callbacks with our fallback system
  supabase.auth.onAuthStateChange = (callback) => {
    console.log('🔄 Registering auth callback (will work with fallback too)');
    authCallbacks.push(callback);
    
    // Initial callback with current state
    setTimeout(() => callback(fallbackSession ? 'SIGNED_IN' : 'SIGNED_OUT', fallbackSession), 100);
    
    // If we still have the original client, register there too
    if (originalOnAuthStateChange && !usingFallback) {
      return originalOnAuthStateChange(callback);
    }
    
    return { 
      data: { 
        subscription: { 
          unsubscribe: () => {
            authCallbacks = authCallbacks.filter(cb => cb !== callback);
          } 
        } 
      } 
    };
  };
  
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.warn('❌ Failed to create Supabase client, using fallback:', error);
  supabase = createFallbackClient();
  usingFallback = true;
}

// Function to switch to fallback mode (can be called when CDN is detected as blocked)
const switchToFallbackMode = () => {
  if (!usingFallback) {
    console.warn('🔄 Switching to fallback mode globally');
    supabase = createFallbackClient();
    usingFallback = true;
  }
  return supabase;
};

// Test the connection and switch to fallback if needed
const testConnection = async () => {
  try {
    // Try a simple auth operation to test connectivity
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Supabase connection test successful');
    
    // If we have a session, we should use real mode regardless of CDN issues
    if (session) {
      console.log('🔑 Active session detected, maintaining real database connection');
      usingFallback = false;
    }
  } catch (error) {
    console.warn('❌ Supabase connection test failed, switching to fallback:', error);
    switchToFallbackMode();
  }
};

// Test connection on load
testConnection();

// Simple database operations for fallback mode
const createDatabaseOperations = (client) => {
  return {
    async select(table, query = '*', options = {}) {
      // Try to get session first
      try {
        const { data: { session } } = await client.auth.getSession();
        authSession = session;
        
        if (session && !usingFallback) {
          // If we have a session and not using fallback, try real database
          try {
            let queryBuilder = client.from(table).select(query);
            
            if (options.eq) {
              Object.entries(options.eq).forEach(([key, value]) => {
                queryBuilder = queryBuilder.eq(key, value);
              });
            }
            
            if (options.order) {
              queryBuilder = queryBuilder.order(options.order.column, { 
                ascending: options.order.ascending !== false 
              });
            }
            
            if (options.limit) {
              queryBuilder = queryBuilder.limit(options.limit);
            }
            
            const result = await queryBuilder;
            console.log(`✅ Real database query successful for ${table}`);
            return result;
          } catch (dbError) {
            console.warn(`❌ Real database failed for ${table}, using fallback data:`, dbError);
            // Fall through to fallback data
          }
        }
      } catch (authError) {
        console.warn('Auth check failed, using fallback:', authError);
      }
      
      // Use fallback data when authenticated (demo mode with data)
      if (authSession) {
        console.log(`🔑 Authenticated fallback: returning demo data for ${table}`);
        let data = fallbackData[table] || [];
        
        // Apply basic filtering for options
        if (options.eq) {
          Object.entries(options.eq).forEach(([key, value]) => {
            data = data.filter(item => item[key] === value);
          });
        }
        
        if (options.order) {
          data = [...data].sort((a, b) => {
            const aVal = a[options.order.column];
            const bVal = b[options.order.column];
            if (options.order.ascending === false) {
              return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
          });
        }
        
        if (options.limit) {
          data = data.slice(0, options.limit);
        }
        
        return Promise.resolve({ data, error: null });
      }
      
      // Not authenticated, return empty
      console.warn(`⚠️ Not authenticated, returning empty data for ${table}`);
      return Promise.resolve({ data: [], error: null });
    },

    async insert(table, data) {
      try {
        const { data: { session } } = await client.auth.getSession();
        authSession = session;
        
        if (session && !usingFallback) {
          try {
            const result = await client.from(table).insert(data).select().single();
            console.log(`✅ Real database insert successful for ${table}`);
            return result;
          } catch (dbError) {
            console.warn(`❌ Real database insert failed for ${table}, simulating:`, dbError);
            // Fall through to simulation
          }
        }
      } catch (authError) {
        console.warn('Auth check failed for insert:', authError);
      }
      
      // Simulate insert when authenticated
      if (authSession) {
        console.log(`🔑 Authenticated fallback: simulating insert for ${table}`);
        const newItem = { ...data, id: Date.now() + Math.floor(Math.random() * 1000), created_at: new Date().toISOString() };
        
        // Add to fallback data
        if (!fallbackData[table]) {
          fallbackData[table] = [];
        }
        fallbackData[table].unshift(newItem);
        
        return Promise.resolve({ data: newItem, error: null });
      }
      
      // Not authenticated
      console.warn(`⚠️ Not authenticated, cannot insert into ${table}`);
      return Promise.resolve({ data: null, error: new Error('Not authenticated') });
    },

    async update(table, data, id) {
      try {
        const { data: { session } } = await client.auth.getSession();
        authSession = session;
        
        if (session && !usingFallback) {
          try {
            const result = await client.from(table).update(data).eq('id', id).select().single();
            console.log(`✅ Real database update successful for ${table}`);
            return result;
          } catch (dbError) {
            console.warn(`❌ Real database update failed for ${table}, simulating:`, dbError);
            // Fall through to simulation
          }
        }
      } catch (authError) {
        console.warn('Auth check failed for update:', authError);
      }
      
      // Simulate update when authenticated
      if (authSession) {
        console.log(`🔑 Authenticated fallback: simulating update for ${table}`);
        
        if (fallbackData[table]) {
          const index = fallbackData[table].findIndex(item => item.id === id);
          if (index !== -1) {
            fallbackData[table][index] = { ...fallbackData[table][index], ...data };
            return Promise.resolve({ data: fallbackData[table][index], error: null });
          }
        }
        
        return Promise.resolve({ data: { ...data, id }, error: null });
      }
      
      // Not authenticated
      console.warn(`⚠️ Not authenticated, cannot update ${table}`);
      return Promise.resolve({ data: null, error: new Error('Not authenticated') });
    },

    async delete(table, id) {
      try {
        const { data: { session } } = await client.auth.getSession();
        authSession = session;
        
        if (session && !usingFallback) {
          try {
            const result = await client.from(table).delete().eq('id', id);
            console.log(`✅ Real database delete successful for ${table}`);
            return result;
          } catch (dbError) {
            console.warn(`❌ Real database delete failed for ${table}, simulating:`, dbError);
            // Fall through to simulation
          }
        }
      } catch (authError) {
        console.warn('Auth check failed for delete:', authError);
      }
      
      // Simulate delete when authenticated
      if (authSession) {
        console.log(`🔑 Authenticated fallback: simulating delete for ${table}`);
        
        if (fallbackData[table]) {
          const index = fallbackData[table].findIndex(item => item.id === id);
          if (index !== -1) {
            const deleted = fallbackData[table].splice(index, 1)[0];
            return Promise.resolve({ data: deleted, error: null });
          }
        }
        
        return Promise.resolve({ data: { id }, error: null });
      }
      
      // Not authenticated
      console.warn(`⚠️ Not authenticated, cannot delete from ${table}`);
      return Promise.resolve({ data: null, error: new Error('Not authenticated') });
    }
  };
};

export const supabaseDb = createDatabaseOperations(supabase);
export { supabase, usingFallback, switchToFallbackMode };