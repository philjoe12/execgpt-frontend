import Link from 'next/link';

import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

interface Props {
  searchParams: Promise<{
    next?: string;
  }>;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signIn'),
  };
};

async function VerifyPage(props: Props) {
  const nextPath = (await props.searchParams).next;
  const redirectPath = nextPath ?? pathsConfig.app.home;

  return (
    <div className={'space-y-4 text-center'}>
      <p className={'text-sm text-muted-foreground'}>
        Multi-factor authentication is not enabled for ExecGPT yet.
      </p>
      <Link className={'text-primary underline'} href={redirectPath}>
        Continue to dashboard
      </Link>
    </div>
  );
}

export default withI18n(VerifyPage);
