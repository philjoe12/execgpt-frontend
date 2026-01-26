import type { ExecgptUser } from '~/lib/auth/types';

import { Header } from '@kit/ui/marketing';

import { AppLogo } from '~/components/app-logo';

import { SiteHeaderAccountSection } from './site-header-account-section';
import { SiteNavigation } from './site-navigation';

export function SiteHeader(props: { user?: ExecgptUser | null; logoSrc?: string }) {
  return (
    <Header
      logo={<AppLogo logoSrc={props.logoSrc} />}
      navigation={<SiteNavigation />}
      actions={<SiteHeaderAccountSection user={props.user ?? null} />}
    />
  );
}
