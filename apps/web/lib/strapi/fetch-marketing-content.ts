type StrapiFetchOptions = {
  slug: string;
  tenantSlug?: string | null;
};

export async function fetchMarketingContent<T>({
  slug,
  tenantSlug,
}: StrapiFetchOptions): Promise<T | null> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.execgpt.com';
  const strapiToken = process.env.STRAPI_API_TOKEN;
  const tenantParam = tenantSlug ? `&tenant=${encodeURIComponent(tenantSlug)}` : '';
  const url = `${strapiUrl}/api/marketing-pages?filters[slug][$eq]=${encodeURIComponent(slug)}${tenantParam}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: strapiToken
        ? {
            Authorization: `Bearer ${strapiToken}`,
            ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
          }
        : tenantSlug
          ? { 'x-tenant-slug': tenantSlug }
          : undefined,
    });
    if (!res.ok) {
      return null;
    }
    const payload = await res.json();
    return payload?.data?.[0]?.attributes?.content ?? null;
  } catch {
    return null;
  }
}
