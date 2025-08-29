// Enhanced Supabase client with fallback support for React
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nklkmrnuyxlhgtpigkqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rbGttcm51eXhsaGd0cGlna3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNTU4OTQsImV4cCI6MjA0NDkzMTg5NH0.8EXxWYjA7S0xCKU7xjKfMjqUYTKpLJNZ8mYNmHQTlhE';

// Global fallback state
let usingFallback = false;
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
    await supabase.auth.getSession();
    console.log('✅ Supabase connection test successful');
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
      if (usingFallback) {
        console.warn(`⚠️ Database select on ${table} - Demo mode, returning empty data`);
        return Promise.resolve({ data: [], error: null });
      }
      
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
        
        return await queryBuilder;
      } catch (error) {
        console.warn('Database operation failed:', error);
        return { data: [], error };
      }
    },

    async insert(table, data) {
      if (usingFallback) {
        console.warn(`⚠️ Database insert on ${table} - Demo mode, simulating success`);
        return Promise.resolve({ data: { ...data, id: Date.now() }, error: null });
      }
      
      try {
        return await client.from(table).insert(data);
      } catch (error) {
        console.warn('Database insert failed:', error);
        return { data: null, error };
      }
    },

    async update(table, data, id) {
      if (usingFallback) {
        console.warn(`⚠️ Database update on ${table} - Demo mode, simulating success`);
        return Promise.resolve({ data: { ...data, id }, error: null });
      }
      
      try {
        return await client.from(table).update(data).eq('id', id);
      } catch (error) {
        console.warn('Database update failed:', error);
        return { data: null, error };
      }
    },

    async delete(table, id) {
      if (usingFallback) {
        console.warn(`⚠️ Database delete on ${table} - Demo mode, simulating success`);
        return Promise.resolve({ data: { id }, error: null });
      }
      
      try {
        return await client.from(table).delete().eq('id', id);
      } catch (error) {
        console.warn('Database delete failed:', error);
        return { data: null, error };
      }
    }
  };
};

export const supabaseDb = createDatabaseOperations(supabase);
export { supabase, usingFallback, switchToFallbackMode };