import { PageBody, PageHeader } from '@kit/ui/page';

import { AgentsPanel } from './agents-panel';

export default function AgentsPage() {
  return (
    <>
      <PageHeader
        title={'Agents'}
        description={'Create and deploy tenant agents running on Bluebear.ai Kubernetes.'}
      />
      <PageBody>
        <AgentsPanel />
      </PageBody>
    </>
  );
}
