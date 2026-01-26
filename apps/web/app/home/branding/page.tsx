import { PageBody, PageHeader } from '@kit/ui/page';

import { BrandingClient } from './branding-client';

export default function BrandingPage() {
  return (
    <>
      <PageHeader
        title={'Branding'}
        description={'Manage your ExecGPT tenant branding and logo.'}
      />
      <PageBody>
        <BrandingClient />
      </PageBody>
    </>
  );
}
