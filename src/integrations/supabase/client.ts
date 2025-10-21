// src/integrations/supabase/client.ts
// Temporary placeholder to prevent import errors while migrating from Supabase -> Firebase.
// This provides the minimal shapes the app expects. Replace with real logic later.

export const supabase = {
  // `from(table).select(...)` -> return an object with maybeSingle/whatever used in the app.
  from: (tableName: string) => ({
    select: async (..._args: any[]) => ({ data: [], error: null }),
    insert: async (_rows: any) => ({ data: null, error: null }),
    update: async (_rows: any) => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
  }),
  auth: {
    // stubbed auth functions (return shapes that won't crash)
    signUp: async (_opts: any) => ({ data: null, error: null }),
    signInWithPassword: async (_opts: any) => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async (_email: string, _opts?: any) => ({ error: null }),
  },
  // If any other methods (e.g., storage) are used, add tiny stubs here later.
};
