import 'server-only';

import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME, DEFAULT_AUTH_API_BASE } from '~/lib/auth/constants';

type TenantAccess = {
  tenantId: string;
  role: string;
  canManageCustomers: boolean;
  canManageBranding: boolean;
  tenantRole?: string | null;
  brandingLogoUrl?: string | null;
};

export async function getTenantAccessInServerComponent(): Promise<TenantAccess | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || DEFAULT_AUTH_API_BASE;
  const response = await fetch(`${apiBase}/api/v1/tenants/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    tenant_id?: string;
    role?: string;
    can_manage_customers?: boolean;
    tenant_role?: string | null;
    branding_logo_url?: string | null;
  };

  const tenantRole = payload.tenant_role || null;
  const canManageCustomers = Boolean(payload.can_manage_customers);
  const canManageBranding =
    canManageCustomers || tenantRole === 'admin' || payload.role === 'platform';

  return {
    tenantId: payload.tenant_id || '',
    role: payload.role || 'customer',
    canManageCustomers,
    canManageBranding,
    tenantRole,
    brandingLogoUrl: payload.branding_logo_url ?? null,
  };
}
