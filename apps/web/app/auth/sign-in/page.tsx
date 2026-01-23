import Link from 'next/link';

import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';
import { ExecgptSignInForm } from '~/auth/_components/execgpt-sign-in-form';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signIn'),
  };
};

function SignInPage() {
  return (
    <>
      <Heading level={5} className={'tracking-tight'}>
        <Trans i18nKey={'auth:signInHeading'} />
      </Heading>

      <ExecgptSignInForm />

      <div className={'flex justify-center text-sm'}>
        <Link href={pathsConfig.auth.signUp}>
          <Trans i18nKey={'auth:doNotHaveAccountYet'} />
        </Link>
      </div>
    </>
  );
}

export default withI18n(SignInPage);
