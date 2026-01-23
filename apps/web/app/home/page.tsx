import { PageBody, PageHeader } from '@kit/ui/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';

import { DashboardDemo } from '~/home/_components/dashboard-demo';
import { fetchStrapiOrgContent } from '~/lib/strapi/fetch-org-content';
import { resolveTenantSlugFromHeaders } from '~/lib/tenant/resolve-tenant-slug';

type DashboardCmsContent = {
  title?: string;
  description?: string;
  widgets?: Array<{
    title?: string;
    value?: string;
    description?: string;
  }>;
};

async function getDashboardContent(): Promise<DashboardCmsContent | null> {
  const organizationSlug = resolveTenantSlugFromHeaders();
  return fetchStrapiOrgContent<DashboardCmsContent>({
    contentType: 'dashboard-pages',
    slug: 'dashboard',
    organizationSlug,
  });
}

export default async function HomePage() {
  const cmsContent = await getDashboardContent();
  const title = cmsContent?.title || 'Dashboard';
  const description = cmsContent?.description || 'Your SaaS at a glance';
  const widgets = cmsContent?.widgets || [];

  return (
    <>
      <PageHeader title={title} description={description} />

      <PageBody>
        {widgets.length ? (
          <div className={'grid gap-6 lg:grid-cols-3'}>
            {widgets.map((widget, index) => (
              <Card key={`${widget.title}-${index}`}>
                <CardHeader>
                  <CardTitle>{widget.title}</CardTitle>
                  {widget.description ? (
                    <CardDescription>{widget.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <div className={'text-3xl font-semibold'}>{widget.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <DashboardDemo />
        )}
      </PageBody>
    </>
  );
}
