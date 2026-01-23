import { PageBody, PageHeader } from '@kit/ui/page';

import { IntegrationsPanel } from './integrations-panel';

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title={'Integrations'}
        description={'Discover and connect services for your ExecGPT customer deployment.'}
      />
      <PageBody>
        <IntegrationsPanel />
      </PageBody>
    </>
  );
}
