import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('auth:passwordResetLabel'),
  };
};

function PasswordResetPage() {
  return (
    <>
      <Heading level={5} className={'tracking-tight'}>
        <Trans i18nKey={'auth:passwordResetLabel'} />
      </Heading>

      <p className={'text-sm text-muted-foreground'}>
        Password reset is handled by ExecGPT support. Reach out to your admin
        or support team to reset your password.
      </p>
    </>
  );
}

export default withI18n(PasswordResetPage);
