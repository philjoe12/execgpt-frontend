import Link from 'next/link';

import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';
import { ExecgptSignUpForm } from '~/auth/_components/execgpt-sign-up-form';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { fetchMarketingContent } from '~/lib/strapi/fetch-marketing-content';

type WaitlistConfig = {
  smsOptInEnabled?: boolean;
  smsOptInLabel?: string;
  smsOptInPlaceholder?: string;
};

type MarketingContent = {
  waitlist?: WaitlistConfig;
};

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signUp'),
  };
};

async function SignUpPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const marketingContent = await fetchMarketingContent<MarketingContent>({ slug: 'home' });
  const waitlist = marketingContent?.waitlist;
  const forceWaitlist = searchParams?.mode === 'waitlist';

  return (
    <>
      <Heading level={5} className={'tracking-tight'}>
        <Trans i18nKey={'auth:signUpHeading'} />
      </Heading>

      <ExecgptSignUpForm
        waitlistSms={
          waitlist
            ? {
                enabled: waitlist.smsOptInEnabled,
                label: waitlist.smsOptInLabel,
                placeholder: waitlist.smsOptInPlaceholder,
              }
            : undefined
        }
        forceWaitlist={forceWaitlist}
      />

      <div className={'flex justify-center text-sm'}>
        <Link href={pathsConfig.auth.signIn}>
          <Trans i18nKey={'auth:alreadyHaveAnAccount'} />
        </Link>
      </div>
    </>
  );
}

export default withI18n(SignUpPage);
