import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageHeader } from '@kit/ui/page';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

async function UserSettingsLayout(props: React.PropsWithChildren) {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:settingsTab');

  return (
    <>
      <PageHeader title={title} description={<AppBreadcrumbs />} />

      {props.children}
    </>
  );
}

export default withI18n(UserSettingsLayout);
