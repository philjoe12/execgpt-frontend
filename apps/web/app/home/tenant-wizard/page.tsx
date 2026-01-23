import { PageBody, PageHeader } from '@kit/ui/page';
import { redirect } from 'next/navigation';

import pathsConfig from '~/config/paths.config';
import { fetchStrapiOrgContent } from '~/lib/strapi/fetch-org-content';
import { getTenantAccessInServerComponent } from '~/lib/tenant/get-tenant-access';
import { resolveTenantSlugFromHeaders } from '~/lib/tenant/resolve-tenant-slug';

import { TenantWizardForm } from './tenant-wizard-form';

type TenantWizardCmsContent = {
  title?: string;
  description?: string;
  steps?: Array<{ title?: string; description?: string }>;
  form_labels?: {
    api_key_label?: string;
    name_label?: string;
    email_label?: string;
    subdomain_label?: string;
    deployment_type_label?: string;
    cta_label?: string;
  };
};

type DeploymentOption = {
  type: string;
  name: string;
};

async function getTenantWizardContent(): Promise<TenantWizardCmsContent | null> {
  const organizationSlug = resolveTenantSlugFromHeaders();
  return fetchStrapiOrgContent<TenantWizardCmsContent>({
    contentType: 'tenant-wizard-pages',
    slug: 'tenant-wizard',
    organizationSlug,
  });
}

async function getDeploymentOptions(): Promise<DeploymentOption[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.execgpt.com';
  const url = `${apiBase}/api/v1/deploy/options`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return [];
    }
    const payload = await res.json();
    return payload?.deployment_methods?.map((method: DeploymentOption) => ({
      type: method.type,
      name: method.name,
    })) ?? [];
  } catch {
    return [];
  }
}

export default async function TenantWizardPage() {
  const tenantAccess = await getTenantAccessInServerComponent();
  const canManageCustomers = Boolean(
    tenantAccess?.canManageCustomers || tenantAccess?.role === 'platform',
  );

  if (!canManageCustomers) {
    redirect(pathsConfig.app.home);
  }

  const cmsContent = await getTenantWizardContent();
  const options = await getDeploymentOptions();
  const title = cmsContent?.title || 'Tenant Creation Wizard';
  const description =
    cmsContent?.description ||
    'Provision a new customer tenant and choose the best deployment type for their needs.';

  return (
    <>
      <PageHeader title={title} description={description} />

      <PageBody>
        {cmsContent?.steps?.length ? (
          <div className={'mb-8 grid gap-4 lg:grid-cols-3'}>
            {cmsContent.steps.map((step, index) => (
              <div key={`${step.title}-${index}`} className={'rounded-lg border p-4'}>
                <div className={'text-muted-foreground text-xs uppercase'}>
                  Step {index + 1}
                </div>
                <div className={'text-base font-semibold'}>{step.title}</div>
                <div className={'text-sm text-muted-foreground'}>{step.description}</div>
              </div>
            ))}
          </div>
        ) : null}

        <TenantWizardForm
          options={options.length ? options : [{ type: 'embedded_widget', name: 'Embedded Widget' }]}
          labels={
            cmsContent?.form_labels && {
              apiKeyLabel: cmsContent.form_labels.api_key_label,
              nameLabel: cmsContent.form_labels.name_label,
              emailLabel: cmsContent.form_labels.email_label,
              subdomainLabel: cmsContent.form_labels.subdomain_label,
              deploymentTypeLabel: cmsContent.form_labels.deployment_type_label,
              ctaLabel: cmsContent.form_labels.cta_label,
            }
          }
        />
      </PageBody>
    </>
  );
}
