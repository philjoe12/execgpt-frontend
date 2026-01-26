import pathsConfig from '~/config/paths.config';

type NavigationRoutes = Array<
  | {
      label: string;
      children: Array<{
        label: string;
        path: string;
        Icon?: React.ReactNode;
        end?: boolean | ((path: string) => boolean);
      }>;
    }
  | {
      label: string;
      path: string;
      Icon?: React.ReactNode;
      end?: boolean | ((path: string) => boolean);
    }
  | { divider: true }
>;

type FilterOptions = {
  canManageCustomers: boolean;
  canManageBranding: boolean;
};

const customerRestrictedPaths = new Set([pathsConfig.app.tenantWizard, pathsConfig.app.customers]);
const brandingRestrictedPaths = new Set([pathsConfig.app.branding]);

export function filterNavigationRoutes(
  routes: NavigationRoutes,
  options: FilterOptions,
): NavigationRoutes {
  if (options.canManageCustomers && options.canManageBranding) {
    return routes;
  }

  return routes
    .map((route) => {
      if ('children' in route) {
        const children = route.children.filter((child) => {
          if (!options.canManageCustomers && customerRestrictedPaths.has(child.path)) {
            return false;
          }
          if (!options.canManageBranding && brandingRestrictedPaths.has(child.path)) {
            return false;
          }
          return true;
        });
        if (!children.length) {
          return null;
        }
        return { ...route, children };
      }

      if ('divider' in route) {
        return route;
      }

      if (!options.canManageCustomers && customerRestrictedPaths.has(route.path)) {
        return null;
      }

      if (!options.canManageBranding && brandingRestrictedPaths.has(route.path)) {
        return null;
      }

      return route;
    })
    .filter(Boolean) as NavigationRoutes;
}
