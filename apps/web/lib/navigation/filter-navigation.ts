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
};

const restrictedPaths = new Set([
  pathsConfig.app.tenantWizard,
  pathsConfig.app.customers,
]);

export function filterNavigationRoutes(
  routes: NavigationRoutes,
  options: FilterOptions,
): NavigationRoutes {
  if (options.canManageCustomers) {
    return routes;
  }

  return routes
    .map((route) => {
      if ('children' in route) {
        const children = route.children.filter(
          (child) => !restrictedPaths.has(child.path),
        );
        if (!children.length) {
          return null;
        }
        return { ...route, children };
      }

      if ('divider' in route) {
        return route;
      }

      if (restrictedPaths.has(route.path)) {
        return null;
      }

      return route;
    })
    .filter(Boolean) as NavigationRoutes;
}
