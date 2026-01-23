'use client';

import { useRouter } from 'next/navigation';

import { LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { ProfileAvatar } from '@kit/ui/profile-avatar';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';
import { clearAuthToken } from '~/lib/auth/client';
import type { ExecgptUser } from '~/lib/auth/types';

const paths = {
  home: pathsConfig.app.home,
};

export function ProfileAccountDropdownContainer(props: {
  user?: ExecgptUser | null;
  showProfileName?: boolean;
}) {
  const router = useRouter();
  const user = props.user;

  if (!user) {
    return null;
  }

  const displayName = user.username || user.email || 'Account';

  const handleSignOut = () => {
    clearAuthToken();
    router.push(pathsConfig.auth.signIn);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open your profile menu"
        className={'flex items-center gap-x-3 rounded-md p-2 hover:bg-secondary'}
      >
        <ProfileAvatar
          className={'rounded-md'}
          fallbackClassName={'rounded-md border'}
          displayName={displayName}
        />

        {props.showProfileName ? (
          <div className={'flex flex-col truncate text-left'}>
            <span className={'truncate text-sm'}>{displayName}</span>
            <span className={'text-muted-foreground truncate text-xs'}>
              {user.email}
            </span>
          </div>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent className={'xl:!min-w-[15rem]'}>
        <DropdownMenuItem className={'!h-10 rounded-none'}>
          <div className={'flex flex-col truncate text-left text-xs'}>
            <div className={'text-muted-foreground'}>
              <Trans i18nKey={'common:signedInAs'} />
            </div>
            <div className={'truncate'}>{user.email}</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a
            className={'s-full flex cursor-pointer items-center space-x-2'}
            href={paths.home}
          >
            <span>
              <Trans i18nKey={'common:routes.home'} />
            </span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          role={'button'}
          className={'cursor-pointer'}
          onClick={handleSignOut}
        >
          <span className={'flex w-full items-center space-x-2'}>
            <LogOut className={'h-5'} />
            <span>
              <Trans i18nKey={'auth:signOut'} />
            </span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
