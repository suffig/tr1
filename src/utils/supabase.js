// Migrate existing supabaseClient.js to React utils
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://nklkmrnuyxlhgtpigkqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rbGttcm51eXhsaGd0cGlna3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNTU4OTQsImV4cCI6MjA0NDkzMTg5NH0.8EXxWYjA7S0xCKU7xjKfMjqUYTKpLJNZ8mYNmHQTlhE';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
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

// Enhanced database operations with retry logic
class SupabaseDatabase {
  constructor(client) {
    this.client = client;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async withRetry(operation, maxRetries = this.maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries || this.isNonRetryableError(error)) {
          throw error;
        }
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  isNonRetryableError(error) {
    return (
      error?.code === 'PGRST301' || // Row not found
      error?.code === 'PGRST204' || // No content
      error?.message?.includes('duplicate key') ||
      error?.message?.includes('violates foreign key') ||
      error?.status === 401 || // Unauthorized
      error?.status === 403    // Forbidden
    );
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async select(table, query = '*', options = {}) {
    return this.withRetry(async () => {
      let queryBuilder = this.client.from(table).select(query);
      
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
      
      if (options.range) {
        queryBuilder = queryBuilder.range(options.range.from, options.range.to);
      }
      
      return await queryBuilder;
    });
  }

  async insert(table, data) {
    return this.withRetry(async () => {
      return await this.client.from(table).insert(data);
    });
  }

  async update(table, data, id) {
    return this.withRetry(async () => {
      return await this.client.from(table).update(data).eq('id', id);
    });
  }

  async delete(table, id) {
    return this.withRetry(async () => {
      return await this.client.from(table).delete().eq('id', id);
    });
  }
}

export const supabaseDb = new SupabaseDatabase(supabase);
export const usingFallback = false;