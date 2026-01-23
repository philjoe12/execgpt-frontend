import { PageBody, PageHeader } from '@kit/ui/page';
import { Badge } from '@kit/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import { CustomerProvisioningForm } from './customer-provisioning-form';
import { fetchStrapiOrgContent } from '~/lib/strapi/fetch-org-content';
import { resolveTenantSlugFromHeaders } from '~/lib/tenant/resolve-tenant-slug';

type DeploymentOption = {
  type: string;
  name: string;
  description: string;
  use_case: string;
  setup_time: string;
  complexity: string;
  features: string[];
};

type DeploymentCmsContent = {
  title?: string;
  description?: string;
  recommended_type?: string;
  deployment_options?: DeploymentOption[];
};

type DeploymentOptionsResponse = {
  deployment_methods: DeploymentOption[];
  recommendation_matrix?: {
    quick_start?: string;
    maximum_control?: string;
    complete_platform?: string;
    balanced_approach?: string;
  };
};

const FALLBACK_OPTIONS: DeploymentOptionsResponse = {
  deployment_methods: [
    {
      type: 'embedded_widget',
      name: 'Embeddable Widget',
      description: 'JavaScript widget for embedding in existing websites',
      use_case: 'Add AI features to existing sites',
      setup_time: '< 30 seconds',
      complexity: 'Low',
      features: ['Copy-paste embed code', 'Customizable styling', 'Minimal integration'],
    },
    {
      type: 'api_only',
      name: 'API & SDK Integration',
      description: 'Backend APIs and SDKs for custom frontend development',
      use_case: 'Maximum flexibility, custom implementations',
      setup_time: '< 1 minute',
      complexity: 'High',
      features: ['Full API access', 'Custom SDKs', 'WebSocket support', 'Self-hosted frontend'],
    },
    {
      type: 'frontend_app',
      name: 'Hosted Frontend Applications',
      description: 'Deploy React/Vue/Next.js apps with auto-scaling and CDN',
      use_case: 'Complete platform deployment like Vercel',
      setup_time: '2-5 minutes',
      complexity: 'Medium',
      features: ['Git integration', 'Auto SSL', 'CDN optimization', 'Preview deployments'],
    },
    {
      type: 'hybrid',
      name: 'Hybrid (Backend APIs + Hosted Frontend)',
      description: 'Combine API backend with hosted frontend applications',
      use_case: 'Best of both worlds - flexibility + convenience',
      setup_time: '3-7 minutes',
      complexity: 'Medium',
      features: ['API backend', 'Hosted frontend', 'Auto SDK injection', 'Real-time updates'],
    },
  ],
  recommendation_matrix: {
    quick_start: 'embedded_widget',
    maximum_control: 'api_only',
    complete_platform: 'frontend_app',
    balanced_approach: 'hybrid',
  },
};

async function getDeploymentContent(): Promise<DeploymentCmsContent | null> {
  const organizationSlug = resolveTenantSlugFromHeaders();
  return fetchStrapiOrgContent<DeploymentCmsContent>({
    contentType: 'deployments-pages',
    slug: 'deployments',
    organizationSlug,
  });
}

async function getDeploymentOptions(): Promise<DeploymentOptionsResponse> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.execgpt.com';
  const url = `${apiBase}/api/v1/deploy/options`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return FALLBACK_OPTIONS;
    }
    const data = (await res.json()) as DeploymentOptionsResponse;
    return data?.deployment_methods?.length ? data : FALLBACK_OPTIONS;
  } catch {
    return FALLBACK_OPTIONS;
  }
}

export default async function DeploymentsPage() {
  const cmsContent = await getDeploymentContent();
  const optionsResponse = await getDeploymentOptions();
  const cmsOptions = cmsContent?.deployment_options;
  const options = cmsOptions?.length ? cmsOptions : optionsResponse.deployment_methods;
  const recommendedType =
    cmsContent?.recommended_type || optionsResponse.recommendation_matrix?.quick_start;
  const title = cmsContent?.title || 'Deployment Options';
  const description =
    cmsContent?.description ||
    'Choose how you want to deploy AI agents for your customers. These options power white-label deployments.';

  return (
    <>
      <PageHeader
        title={title}
        description={description}
      />

      <PageBody>
        <div className={'grid gap-6 lg:grid-cols-2'}>
          {options.map((option) => (
            <Card key={option.type} className={'shadow-sm'}>
              <CardHeader className={'space-y-3'}>
                <div className={'flex items-center justify-between'}>
                  <CardTitle>{option.name}</CardTitle>
                  {option.type === recommendedType ? (
                    <Badge variant={'success'}>Recommended</Badge>
                  ) : null}
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent className={'space-y-4 text-sm'}>
                <div className={'space-y-1'}>
                  <div className={'text-muted-foreground text-xs uppercase tracking-wide'}>
                    Use Case
                  </div>
                  <div>{option.use_case}</div>
                </div>
                <div className={'grid gap-4 sm:grid-cols-2'}>
                  <div className={'space-y-1'}>
                    <div className={'text-muted-foreground text-xs uppercase tracking-wide'}>
                      Setup Time
                    </div>
                    <div>{option.setup_time}</div>
                  </div>
                  <div className={'space-y-1'}>
                    <div className={'text-muted-foreground text-xs uppercase tracking-wide'}>
                      Complexity
                    </div>
                    <div>{option.complexity}</div>
                  </div>
                </div>
                <div className={'space-y-2'}>
                  <div className={'text-muted-foreground text-xs uppercase tracking-wide'}>
                    Included Features
                  </div>
                  <ul className={'list-disc space-y-1 pl-5'}>
                    {option.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={'mt-10'}>
          <CustomerProvisioningForm
            recommendedType={recommendedType}
            options={options.map((option) => ({
              type: option.type,
              name: option.name,
            }))}
          />
        </div>
      </PageBody>
    </>
  );
}
