import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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

export const createClient = () => {
  const cookieStore = cookies();

  return createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options: { path: string; maxAge: number; sameSite: string }) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // ReadonlyRequestCookiesエラーを無視
          }
        },
        remove(name: string, options: { path: string }) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // ReadonlyRequestCookiesエラーを無視
          }
        },
      },
    }
  );
};
