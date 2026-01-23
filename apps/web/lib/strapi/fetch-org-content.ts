type StrapiFetchOptions = {
  contentType: string;
  slug: string;
  organizationSlug: string;
  usePrefix?: boolean;
};

export async function fetchStrapiOrgContent<T>({
  contentType,
  slug,
  organizationSlug,
  usePrefix = true,
}: StrapiFetchOptions): Promise<T | null> {
  const strapiUrl =
    process.env.STRAPI_URL_INTERNAL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    'https://cms.execgpt.com';
  const strapiToken = process.env.STRAPI_API_TOKEN;
  const effectiveSlug = usePrefix ? `${organizationSlug}__${slug}` : slug;
  const url = `${strapiUrl}/api/${contentType}?filters[slug][$eq]=${effectiveSlug}&filters[organization][slug][$eq]=${organizationSlug}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: strapiToken ? { Authorization: `Bearer ${strapiToken}` } : undefined,
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
