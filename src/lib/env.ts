function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  kidSessionSecret: () => required("KID_SESSION_SECRET"),
  adminEmails: (): string[] =>
    required("ADMIN_EMAILS").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
};
