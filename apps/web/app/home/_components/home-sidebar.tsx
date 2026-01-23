import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNavigation,
} from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { navigationConfig } from '~/config/navigation.config';
import type { ExecgptUser } from '~/lib/auth/types';

export function HomeSidebar(props: {
  user: ExecgptUser;
  navigation: typeof navigationConfig;
  logoSrc?: string | null;
}) {
  return (
    <Sidebar collapsible={'icon'}>
      <SidebarHeader className={'h-16 justify-center'}>
        <div className={'flex items-center justify-between space-x-2'}>
          <div>
            <AppLogo className={'max-w-full'} logoSrc={props.logoSrc ?? undefined} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarNavigation config={props.navigation} />
      </SidebarContent>

      <SidebarFooter>
        <ProfileAccountDropdownContainer user={props.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
