import 'server-only';

import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME, DEFAULT_AUTH_API_BASE } from './constants';
import type { ExecgptUser } from './types';

type AuthMeResponse = {
  user?: ExecgptUser;
  data?: {
    user?: ExecgptUser;
  };
};

function getAuthApiBase() {
  return (
    process.env.AUTH_API_BASE_INTERNAL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_AUTH_API_BASE
  );
}

export async function fetchAuthUser(token: string) {
  const apiBase = getAuthApiBase();

  const response = await fetch(`${apiBase}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as AuthMeResponse;
  return payload.user ?? payload.data?.user ?? null;
}

export async function getServerAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return fetchAuthUser(token);
}
