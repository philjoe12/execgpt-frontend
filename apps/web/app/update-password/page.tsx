import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('auth:updatePassword'),
  };
};

interface UpdatePasswordPageProps {
  searchParams: Promise<{
    callback?: string;
  }>;
}

async function UpdatePasswordPage(props: UpdatePasswordPageProps) {
  await requireUserInServerComponent();

  void props;

  return (
    <div className={'space-y-2'}>
      <p className={'text-sm text-muted-foreground'}>
        Password updates are managed by ExecGPT support. Contact your admin
        to change your password.
      </p>
    </div>
  );
}

export default withI18n(UpdatePasswordPage);
