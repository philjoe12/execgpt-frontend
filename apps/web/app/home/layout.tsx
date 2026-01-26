import { use } from 'react';

import { cookies } from 'next/headers';

import { MessageSquare } from 'lucide-react';

import {
  Page,
  PageLayoutStyle,
  PageMobileNavigation,
  PageNavigation,
} from '@kit/ui/page';
import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { navigationConfig } from '~/config/navigation.config';
import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';
import { filterNavigationRoutes } from '~/lib/navigation/filter-navigation';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';
import { getTenantAgentsForSidebar } from '~/lib/agents/get-tenant-agents';
import { getTenantAccessInServerComponent } from '~/lib/tenant/get-tenant-access';

// home imports
import { HomeMenuNavigation } from './_components/home-menu-navigation';
import { HomeMobileNavigation } from './_components/home-mobile-navigation';
import { HomeSidebar } from './_components/home-sidebar';

function HomeLayout({ children }: React.PropsWithChildren) {
  const style = use(getLayoutStyle());

  if (style === 'sidebar') {
    return <SidebarLayout>{children}</SidebarLayout>;
  }

  return <HeaderLayout>{children}</HeaderLayout>;
}

export default withI18n(HomeLayout);

function SidebarLayout({ children }: React.PropsWithChildren) {
  const sidebarMinimized = navigationConfig.sidebarCollapsed;
  const [user, tenantAccess] = use(
    Promise.all([requireUserInServerComponent(), getTenantAccessInServerComponent()]),
  );
  const agents = use(getTenantAgentsForSidebar(tenantAccess?.tenantId ?? null));
  const canManageCustomers = Boolean(
    tenantAccess?.canManageCustomers || tenantAccess?.role === 'platform',
  );
  const canManageBranding = Boolean(
    tenantAccess?.canManageBranding || tenantAccess?.role === 'platform',
  );
  const logoSrc = tenantAccess?.brandingLogoUrl || undefined;
  const filteredRoutes = filterNavigationRoutes(navigationConfig.routes, {
    canManageCustomers,
    canManageBranding,
  });
  const filteredNavigation = {
    ...navigationConfig,
    routes: injectAgentRoutes(filteredRoutes, agents),
  };

  return (
    <SidebarProvider defaultOpen={sidebarMinimized}>
      <Page style={'sidebar'}>
        <PageNavigation>
          <HomeSidebar user={user} navigation={filteredNavigation} logoSrc={logoSrc} />
        </PageNavigation>

        <PageMobileNavigation className={'flex items-center justify-between'}>
          <MobileNavigation
            canManageCustomers={canManageCustomers}
            canManageBranding={canManageBranding}
            logoSrc={logoSrc}
          />
        </PageMobileNavigation>

        {children}
      </Page>
    </SidebarProvider>
  );
}

function HeaderLayout({ children }: React.PropsWithChildren) {
  const [user, tenantAccess] = use(
    Promise.all([requireUserInServerComponent(), getTenantAccessInServerComponent()]),
  );
  const agents = use(getTenantAgentsForSidebar(tenantAccess?.tenantId ?? null));
  const canManageCustomers = Boolean(
    tenantAccess?.canManageCustomers || tenantAccess?.role === 'platform',
  );
  const canManageBranding = Boolean(
    tenantAccess?.canManageBranding || tenantAccess?.role === 'platform',
  );
  const logoSrc = tenantAccess?.brandingLogoUrl || undefined;
  const filteredRoutes = filterNavigationRoutes(navigationConfig.routes, {
    canManageCustomers,
    canManageBranding,
  });
  const filteredNavigation = {
    ...navigationConfig,
    routes: injectAgentRoutes(filteredRoutes, agents),
  };

  return (
    <Page style={'header'}>
      <PageNavigation>
        <HomeMenuNavigation
          user={user}
          navigation={filteredNavigation}
          logoSrc={logoSrc}
          agents={agents}
        />
      </PageNavigation>

      <PageMobileNavigation className={'flex items-center justify-between'}>
        <MobileNavigation
          canManageCustomers={canManageCustomers}
          canManageBranding={canManageBranding}
          logoSrc={logoSrc}
        />
      </PageMobileNavigation>

      {children}
    </Page>
  );
}

function MobileNavigation(props: {
  canManageCustomers: boolean;
  canManageBranding: boolean;
  logoSrc?: string;
}) {
  return (
    <>
      <AppLogo logoSrc={props.logoSrc} />

      <HomeMobileNavigation
        canManageCustomers={props.canManageCustomers}
        canManageBranding={props.canManageBranding}
      />
    </>
  );
}

async function getLayoutStyle() {
  const cookieStore = await cookies();

  return (
    (cookieStore.get('layout-style')?.value as PageLayoutStyle) ??
    navigationConfig.style
  );
}

function injectAgentRoutes(
  routes: typeof navigationConfig.routes,
  agents: Array<{ id: string; name: string; status?: string | null }>,
) {
  if (!agents.length) {
    return routes;
  }

  const activeAgents = agents.filter((agent) => agent.status === 'active');
  const visibleAgents = activeAgents.length ? activeAgents : agents;
  if (!visibleAgents.length) {
    return routes;
  }

  const activeAgentItems = visibleAgents.map((agent) => ({
    label: agent.name,
    path: `/home/agents/${agent.id}/chat`,
    end: false,
    Icon: <MessageSquare className={'w-4'} />,
  }));

  const baseRoutes = routes.map((group) => {
    if (!('children' in group)) {
      return group;
    }

    return {
      ...group,
      children: group.children.map((child) => child),
    };
  });

  const activeAgentsGroup = {
    label: 'Active Agents',
    children: activeAgentItems,
  };

  const [firstGroup, ...restGroups] = baseRoutes;
  if (!firstGroup || !('children' in firstGroup)) {
    return [...baseRoutes, activeAgentsGroup];
  }

  return [firstGroup, activeAgentsGroup, ...restGroups];
}
