import { PageBody, PageHeader } from '@kit/ui/page';

import { fetchStrapiOrgContent } from '~/lib/strapi/fetch-org-content';
import { resolveTenantSlugFromHeaders } from '~/lib/tenant/resolve-tenant-slug';

import { CustomerListTable } from './customer-list-table';

type CustomerListCmsContent = {
  title?: string;
  description?: string;
  empty_message?: string;
};

async function getCustomerListContent(): Promise<CustomerListCmsContent | null> {
  const organizationSlug = resolveTenantSlugFromHeaders();
  return fetchStrapiOrgContent<CustomerListCmsContent>({
    contentType: 'customer-list-pages',
    slug: 'customers',
    organizationSlug,
  });
}

export default async function CustomersPage() {
  const cmsContent = await getCustomerListContent();
  const title = cmsContent?.title || 'Customer List';
  const description =
    cmsContent?.description ||
    'Review the end customers provisioned under your ExecGPT reseller account.';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.execgpt.com';

  return (
    <>
      <PageHeader title={title} description={description} />

      <PageBody>
        <CustomerListTable apiBase={apiBase} emptyMessage={cmsContent?.empty_message} />
      </PageBody>
    </>
  );
}
