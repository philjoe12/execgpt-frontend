'use client';

import { AUTH_COOKIE_NAME } from './constants';

function getCookieAttributes() {
  const parts = ['Path=/', 'SameSite=Lax'];

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function setAuthToken(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; ${getCookieAttributes()}`;
}

export function clearAuthToken() {
  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; ${getCookieAttributes()}`;
}

export function getAuthToken() {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!match) {
    return null;
  }

  return match.slice(AUTH_COOKIE_NAME.length + 1) || null;
}
