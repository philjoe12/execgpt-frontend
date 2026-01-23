import Link from 'next/link';

import { MessageSquare } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  BorderedNavigationMenu,
  BorderedNavigationMenuItem,
} from '@kit/ui/bordered-navigation-menu';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { navigationConfig } from '~/config/navigation.config';
import type { ExecgptUser } from '~/lib/auth/types';

export function HomeMenuNavigation(props: {
  user: ExecgptUser;
  navigation: typeof navigationConfig;
  logoSrc?: string | null;
  agents?: Array<{ id: string; name: string; status?: string | null }>;
}) {
  const activeAgents = (props.agents ?? []).filter((agent) => agent.status === 'active');
  const routes = props.navigation.routes.reduce<
    Array<{
      path: string;
      label: string;
      Icon?: React.ReactNode;
      end?: boolean | ((path: string) => boolean);
    }>
  >((acc, item) => {
    if ('children' in item) {
      return [...acc, ...item.children];
    }

    if ('divider' in item) {
      return acc;
    }

    return [...acc, item];
  }, []);

  return (
    <div className={'flex w-full flex-1 justify-between'}>
      <div className={'flex items-center space-x-8'}>
        <AppLogo logoSrc={props.logoSrc ?? undefined} />

        <BorderedNavigationMenu>
          {routes.map((route) => (
            <BorderedNavigationMenuItem {...route} key={route.path} />
          ))}
        </BorderedNavigationMenu>
      </div>

      <div className={'flex justify-end space-x-2.5'}>
        {activeAgents.length > 0 ? (
          <div className={'flex items-center gap-2'}>
            <span className={'text-xs text-muted-foreground'}>Active Agents</span>
            {activeAgents.map((agent) => (
              <Button
                key={agent.id}
                asChild
                variant={'outline'}
                size={'icon'}
                title={`Open ${agent.name}`}
              >
                <Link href={`/home/agents/${agent.id}/chat`} aria-label={`Open ${agent.name} chat`}>
                  <MessageSquare className={'h-4 w-4'} />
                </Link>
              </Button>
            ))}
          </div>
        ) : null}
        <div>
          <ProfileAccountDropdownContainer
            user={props.user}
            showProfileName={false}
          />
        </div>
      </div>
    </div>
  );
}
