'use client';

import { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Trans } from '@kit/ui/trans';

import { setAuthToken } from '~/lib/auth/client';
import { DEFAULT_AUTH_API_BASE } from '~/lib/auth/constants';

export function ExecgptSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const nextPath = searchParams.get('next') || '/home';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || DEFAULT_AUTH_API_BASE;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      const token =
        payload?.token ||
        payload?.data?.token ||
        payload?.data?.data?.token;
      if (!token) {
        throw new Error(payload?.error || payload?.data?.error || 'Missing auth token in response.');
      }

      if (!response.ok) {
        throw new Error(payload?.error || payload?.data?.error || 'Unable to sign in.');
      }

      setAuthToken(token);
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }

    setIsResending(true);
    setError('');
    setStatusMessage('');

    try {
      const response = await fetch(`${apiBase}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to resend verification email.');
      }

      setStatusMessage('Verification email sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form className={'space-y-4'} onSubmit={handleSubmit}>
      <div className={'space-y-2'}>
        <label className={'text-sm font-medium'}>
          <Trans i18nKey={'common:emailAddress'} />
        </label>
        <Input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
        />
      </div>

      <div className={'space-y-2'}>
        <label className={'text-sm font-medium'}>
          <Trans i18nKey={'auth:password'} defaults={'Password'} />
        </label>
        <Input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <Alert variant={'destructive'}>
          <AlertTitle>
            <Trans i18nKey={'auth:errors.generic'} defaults={'Sign in failed'} />
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {statusMessage ? (
        <Alert>
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      ) : null}

      {error === 'Email verification required' ? (
        <Button
          type={'button'}
          variant={'secondary'}
          className={'w-full'}
          onClick={handleResendVerification}
          disabled={isResending}
        >
          {isResending ? 'Sending verification...' : 'Resend verification email'}
        </Button>
      ) : null}

      <Button type={'submit'} className={'w-full'} disabled={isSubmitting}>
        {isSubmitting ? (
          <Trans i18nKey={'auth:signingIn'} defaults={'Signing in...'} />
        ) : (
          <Trans i18nKey={'auth:signIn'} defaults={'Sign in'} />
        )}
      </Button>
    </form>
  );
}
