import { createClient } from '@supabase/supabase-js';

let browserClient = null;

export const createBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Browser client can only be created in the browser');
  }

  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return browserClient;
};

export const createServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};
