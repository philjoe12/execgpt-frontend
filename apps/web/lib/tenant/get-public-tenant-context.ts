import 'server-only';

import { headers } from 'next/headers';

import { DEFAULT_AUTH_API_BASE } from '~/lib/auth/constants';

type PublicTenantContext = {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  branding: Record<string, unknown>;
  branding_logo_url?: string | null;
};

export async function getPublicTenantContext(): Promise<PublicTenantContext | null> {
  const host = headers().get('host');
  if (!host) {
    return null;
  }

  const apiBase =
    process.env.AUTH_API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_AUTH_API_BASE;
  const url = `${apiBase}/api/v1/public/tenant-context?domain=${encodeURIComponent(host)}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublicTenantContext;
  } catch {
    return null;
  }
}
