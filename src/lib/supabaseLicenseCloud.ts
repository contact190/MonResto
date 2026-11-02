import { ClientAccount, LicensePlan, SupabaseCloudConfig } from '../types';

const CLOUD_CONFIG_KEY = 'monresto_supabase_config_v1';

interface SupabaseLicenseRow {
  id: string;
  restaurant_name: string;
  owner_name: string;
  phone: string;
  city: string;
  plan: LicensePlan;
  plan_locked_forever: boolean;
  shutoff: boolean;
  shutoff_reason: string | null;
  admin_pin_code: string;
  license_key: string;
  max_staff_quota: number;
  activated_at: string;
  expires_at: string | null;
}

export const getSavedSupabaseConfig = (): SupabaseCloudConfig => {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return {
    url: envUrl,
    anonKey: envKey,
    enabled: Boolean(envUrl && envKey),
  };
};

export const saveSupabaseConfig = (cfg: SupabaseCloudConfig) => {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cfg));
};

const toClientAccount = (row: SupabaseLicenseRow): ClientAccount => ({
  id: row.id,
  restaurantName: row.restaurant_name,
  ownerName: row.owner_name,
  phone: row.phone,
  city: row.city,
  plan: row.plan,
  planLockedForever: row.plan_locked_forever,
  shutoff: row.shutoff,
  shutoffReason: row.shutoff_reason || undefined,
  adminPinCode: row.admin_pin_code,
  licenseKey: row.license_key,
  maxStaffQuota: row.max_staff_quota ?? 3,
  activatedAt: row.activated_at,
  expiresAt: row.expires_at,
});

const toSupabaseRow = (client: ClientAccount): SupabaseLicenseRow => ({
  id: client.id,
  restaurant_name: client.restaurantName,
  owner_name: client.ownerName,
  phone: client.phone,
  city: client.city,
  plan: client.plan,
  plan_locked_forever: client.planLockedForever,
  shutoff: client.shutoff,
  shutoff_reason: client.shutoffReason || null,
  admin_pin_code: client.adminPinCode,
  license_key: client.licenseKey,
  max_staff_quota: client.maxStaffQuota,
  activated_at: client.activatedAt,
  expires_at: client.expiresAt,
});

const getHeaders = (cfg: SupabaseCloudConfig) => ({
  apikey: cfg.anonKey,
  Authorization: `Bearer ${cfg.anonKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

/**
 * Super Admin ONLY: Fetch all client licenses from Supabase (1 lightweight query)
 */
export const fetchAllCloudLicenses = async (
  cfg: SupabaseCloudConfig
): Promise<ClientAccount[] | null> => {
  if (!cfg.enabled || !cfg.url || !cfg.anonKey) return null;
  try {
    const cleanUrl = cfg.url.replace(/\/$/, '');
    const res = await fetch(
      `${cleanUrl}/rest/v1/client_licenses?select=*&order=activated_at.desc`,
      { headers: getHeaders(cfg) }
    );
    if (!res.ok) return null;
    const rows: SupabaseLicenseRow[] = await res.json();
    return rows.map(toClientAccount);
  } catch {
    return null;
  }
};

/**
 * Restaurant Admin Login ONLY: 1 single lightweight SELECT query to verify license,
 * shutoff state, expiration, and max_staff_quota! Zero cloud consumption afterwards.
 */
export const verifyAdminCodeInCloud = async (
  cfg: SupabaseCloudConfig,
  codeOrKey: string
): Promise<ClientAccount | null> => {
  if (!cfg.enabled || !cfg.url || !cfg.anonKey) return null;
  try {
    const cleanUrl = cfg.url.replace(/\/$/, '');
    const cleanCode = encodeURIComponent(codeOrKey.trim());
    const res = await fetch(
      `${cleanUrl}/rest/v1/client_licenses?or=(admin_pin_code.eq.${cleanCode},license_key.eq.${cleanCode})&limit=1`,
      { headers: getHeaders(cfg) }
    );
    if (!res.ok) return null;
    const rows: SupabaseLicenseRow[] = await res.json();
    if (rows.length === 0) return null;
    return toClientAccount(rows[0]);
  } catch {
    return null;
  }
};

/**
 * Super Admin ONLY: Upsert a single client license row into Supabase
 */
export const upsertCloudLicense = async (
  cfg: SupabaseCloudConfig,
  client: ClientAccount
): Promise<boolean> => {
  if (!cfg.enabled || !cfg.url || !cfg.anonKey) return false;
  try {
    const cleanUrl = cfg.url.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/client_licenses`, {
      method: 'POST',
      headers: {
        ...getHeaders(cfg),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(toSupabaseRow(client)),
    });
    return res.ok;
  } catch {
    return false;
  }
};

