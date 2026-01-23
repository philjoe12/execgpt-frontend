import { headers } from 'next/headers';

const RESELLER_SLUG = 'execgpt-platform';
const BASE_DOMAIN = 'execgpt.com';

function normalizeHost(rawHost: string | null) {
  if (!rawHost) return null;

  return rawHost.split(':')[0]?.trim().toLowerCase() || null;
}

export function resolveTenantSlugFromHost(host?: string | null) {
  const normalized = normalizeHost(host ?? null);

  if (!normalized) {
    return RESELLER_SLUG;
  }

  if (normalized === BASE_DOMAIN || normalized === `www.${BASE_DOMAIN}`) {
    return RESELLER_SLUG;
  }

  if (normalized.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = normalized.replace(`.${BASE_DOMAIN}`, '').split('.')[0];
    if (!subdomain || subdomain === 'www') {
      return RESELLER_SLUG;
    }
    return `${RESELLER_SLUG}-${subdomain}`;
  }

  return RESELLER_SLUG;
}

export function resolveTenantSlugFromHeaders() {
  const host = headers().get('host');
  return resolveTenantSlugFromHost(host);
}
