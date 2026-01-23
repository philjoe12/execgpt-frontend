import { Home, Link, MessageCircle, Rocket, User, Users, Wand2 } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.application',
    children: [
      {
        label: 'common:routes.home',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'common:routes.deployments',
        path: pathsConfig.app.deployments,
        Icon: <Rocket className={iconClasses} />,
      },
      {
        label: 'common:routes.integrations',
        path: pathsConfig.app.integrations,
        Icon: <Link className={iconClasses} />,
      },
      {
        label: 'common:routes.chat',
        path: pathsConfig.app.agents,
        Icon: <MessageCircle className={iconClasses} />,
      },
      {
        label: 'common:routes.tenantWizard',
        path: pathsConfig.app.tenantWizard,
        Icon: <Wand2 className={iconClasses} />,
      },
      {
        label: 'common:routes.customers',
        path: pathsConfig.app.customers,
        Icon: <Users className={iconClasses} />,
      },
    ],
  },
  {
    label: 'common:routes.settings',
    children: [
      {
        label: 'common:routes.profile',
        path: pathsConfig.app.profileSettings,
        Icon: <User className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
});
