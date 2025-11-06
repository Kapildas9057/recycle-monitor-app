// Firebase-only project - Supabase stub to prevent auto-gen errors
// DO NOT import @supabase/supabase-js - causes React conflicts
export const supabase = {
  auth: { 
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null })
  },
  from: () => ({ 
    select: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  })
};