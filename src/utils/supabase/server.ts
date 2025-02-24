import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
}

export const createServerClient = () => {
  const cookieStore = cookies();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { path: string; maxAge: number; sameSite: string }) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: { path: string }) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};
