-- ============================================================================
-- MONRESTO COMMERCIAL — ARCHITECTURE CLOUD MINIMALE (SUPABASE)
-- Objectif : Stocker UNIQUEMENT les comptes Clients / Licences Admin (~200 octets/client)
-- Les commandes, menus, stocks et sessions Staff restent 100% en local.
-- ============================================================================

create table if not exists public.client_licenses (
  id text primary key,
  restaurant_name text not null,
  owner_name text not null,
  phone text not null,
  city text not null default 'Alger',
  plan text not null check (plan in ('demo', 'mensuel', 'annuel', 'a_vie')),
  plan_locked_forever boolean not null default false,
  shutoff boolean not null default false,
  shutoff_reason text,
  admin_pin_code text not null,
  license_key text not null unique,
  max_staff_quota integer not null default 3 check (max_staff_quota >= 1),
  activated_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Index rapide pour la vérification de connexion Admin (1 seule lecture par session)
create index if not exists idx_client_licenses_admin_pin on public.client_licenses (admin_pin_code);
create index if not exists idx_client_licenses_key on public.client_licenses (license_key);

-- Activer Row Level Security (RLS)
alter table public.client_licenses enable row level security;

-- Politique permettant la lecture de licence et la gestion depuis la console Super Admin
create policy "Allow public license verification and superadmin management"
  on public.client_licenses
  for all
  using (true)
  with check (true);

