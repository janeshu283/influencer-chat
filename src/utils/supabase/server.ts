import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set in environment variables`);
  }
  return value;
};

const supabaseUrl = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const createServerClient = () => {
  const cookieStore = cookies();
  
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
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
