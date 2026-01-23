'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';

import pathsConfig from '~/config/paths.config';
import { DEFAULT_AUTH_API_BASE } from '~/lib/auth/constants';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Verifying your email...');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || DEFAULT_AUTH_API_BASE;

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }

      try {
        const response = await fetch(`${apiBase}/api/v1/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to verify email.');
        }

        setStatus('success');
        setMessage('Email verified. You can now sign in.');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Unable to verify email.');
      }
    };

    void verify();
  }, [apiBase, token]);

  return (
    <div className={'space-y-4 text-center'}>
      <Alert variant={status === 'error' ? 'destructive' : 'default'}>
        <AlertTitle>{status === 'success' ? 'Verified' : 'Email verification'}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      <Link className={'text-primary underline'} href={pathsConfig.auth.signIn}>
        Go to sign in
      </Link>
    </div>
  );
}
