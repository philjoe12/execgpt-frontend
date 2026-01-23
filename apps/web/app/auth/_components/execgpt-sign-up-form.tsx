'use client';

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Trans } from '@kit/ui/trans';

import { setAuthToken } from '~/lib/auth/client';
import { DEFAULT_AUTH_API_BASE } from '~/lib/auth/constants';

type WaitlistSmsConfig = {
  enabled?: boolean;
  label?: string;
  placeholder?: string;
};

export function ExecgptSignUpForm({
  waitlistSms = {
    enabled: true,
    label: 'Cell phone for text opt-in (optional)',
    placeholder: '(555) 555-5555',
  },
  forceWaitlist: forceWaitlistProp,
}: {
  waitlistSms?: WaitlistSmsConfig;
  forceWaitlist?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const forceWaitlist = forceWaitlistProp ?? searchParams.get('mode') === 'waitlist';
  const [signupMode, setSignupMode] = useState<'open' | 'waitlist' | 'invite_only' | 'closed'>(
    forceWaitlist ? 'waitlist' : 'open',
  );
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [waitlistSmsEnabled, setWaitlistSmsEnabled] = useState(Boolean(waitlistSms.enabled));
  const [waitlistSmsLabel, setWaitlistSmsLabel] = useState(
    waitlistSms.label || 'Cell phone for text opt-in (optional)',
  );
  const [waitlistSmsPlaceholder, setWaitlistSmsPlaceholder] = useState(
    waitlistSms.placeholder || '(555) 555-5555',
  );
  const [waitlistButtonLabel, setWaitlistButtonLabel] = useState('Join waitlist');
  const organizationSlug = process.env.NEXT_PUBLIC_ORGANIZATION_SLUG;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || DEFAULT_AUTH_API_BASE;
  const inviteToken = searchParams.get('invite') || '';

  const isWaitlistFlow = (signupMode === 'waitlist' || forceWaitlist) && !inviteToken;

  const passwordsMatch = useMemo(
    () => password.length > 0 && password === confirmPassword,
    [password, confirmPassword],
  );

  useEffect(() => {
    const loadSignupConfig = async () => {
      try {
        const response = await fetch(
          `${apiBase}/api/v1/auth/signup-config?host=${encodeURIComponent(window.location.host)}`,
        );
        const payload = await response.json();
        if (response.ok) {
          const data = payload?.data ?? payload;
          const resolvedMode = data.signup_mode || data.signupMode || 'open';
          setSignupMode(forceWaitlist ? 'waitlist' : resolvedMode);
          setWaitlistMessage(data.waitlist_message || data.waitlistMessage || '');
          setRequiresVerification(Boolean(data.require_email_verification ?? data.requireEmailVerification));
          if (typeof data.waitlist_sms_opt_in_enabled === 'boolean') {
            setWaitlistSmsEnabled(data.waitlist_sms_opt_in_enabled);
          }
          if (typeof data.waitlistSmsOptInEnabled === 'boolean') {
            setWaitlistSmsEnabled(data.waitlistSmsOptInEnabled);
          }
          if (typeof data.waitlist_sms_opt_in_label === 'string') {
            setWaitlistSmsLabel(data.waitlist_sms_opt_in_label);
          }
          if (typeof data.waitlistSmsOptInLabel === 'string') {
            setWaitlistSmsLabel(data.waitlistSmsOptInLabel);
          }
          if (typeof data.waitlist_sms_opt_in_placeholder === 'string') {
            setWaitlistSmsPlaceholder(data.waitlist_sms_opt_in_placeholder);
          }
          if (typeof data.waitlistSmsOptInPlaceholder === 'string') {
            setWaitlistSmsPlaceholder(data.waitlistSmsOptInPlaceholder);
          }
          if (typeof data.waitlist_button_label === 'string') {
            setWaitlistButtonLabel(data.waitlist_button_label);
          }
          if (typeof data.waitlistButtonLabel === 'string') {
            setWaitlistButtonLabel(data.waitlistButtonLabel);
          }
        }
      } catch (err) {
        // Default to open if config fails to load.
      }
    };

    if (typeof window !== 'undefined') {
      void loadSignupConfig();
    }
  }, [apiBase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isWaitlistFlow && !passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const username = email.split('@')[0] || email;
      const endpoint = inviteToken ? 'accept-invite' : 'register';
      const shouldIncludeSms =
        isWaitlistFlow && waitlistSmsEnabled && Boolean(phone);

      const postSignup = async (includeSms: boolean) => {
        const response = await fetch(`${apiBase}/api/v1/auth/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            inviteToken
              ? { inviteToken, password }
              : isWaitlistFlow
                ? {
                  email,
                  username,
                  ...(organizationSlug ? { organizationSlug } : {}),
                  ...(includeSms
                    ? {
                        phone,
                        smsOptIn: true,
                      }
                    : {}),
                }
              : {
                  email,
                  username,
                  password,
                  ...(organizationSlug ? { organizationSlug } : {}),
                },
          ),
        });

        const payload = await response.json();
        return { response, payload };
      };

      let { response, payload } = await postSignup(shouldIncludeSms);

      if (!response.ok && shouldIncludeSms) {
        const retry = await postSignup(false);
        response = retry.response;
        payload = retry.payload;
      }

      if (!response.ok) {
        throw new Error(payload?.error || payload?.data?.error || 'Unable to create account.');
      }

      if (payload?.waitlisted || signupMode === 'waitlist') {
        setSuccessMessage(waitlistMessage || 'You are on the waitlist.');
        return;
      }

      const token =
        payload?.token ||
        payload?.data?.token ||
        payload?.data?.data?.token;
      if (token) {
        setAuthToken(token);
        router.push('/home');
        return;
      }

      if (requiresVerification) {
        setSuccessMessage('Check your email to verify your account.');
        return;
      }

      setSuccessMessage('Account created successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={'space-y-4'} onSubmit={handleSubmit}>
      {signupMode !== 'open' && !inviteToken ? (
        <Alert>
          <AlertTitle>Sign up by invitation</AlertTitle>
          <AlertDescription>
            {signupMode === 'waitlist'
              ? waitlistMessage || 'Join the waitlist to get an invite.'
              : 'Sign ups are currently by invitation only.'}
          </AlertDescription>
        </Alert>
      ) : null}
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

      {isWaitlistFlow && waitlistSmsEnabled ? (
        <div className={'space-y-2'}>
          <label className={'text-sm font-medium'}>{waitlistSmsLabel}</label>
          <Input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={waitlistSmsPlaceholder}
          />
        </div>
      ) : null}

      {!isWaitlistFlow ? (
        <>
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

          <div className={'space-y-2'}>
            <label className={'text-sm font-medium'}>
              <Trans i18nKey={'auth:confirmPassword'} defaults={'Confirm password'} />
            </label>
            <Input
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
        </>
      ) : null}

      {error ? (
        <Alert variant={'destructive'}>
          <AlertTitle>
            <Trans i18nKey={'auth:errors.generic'} defaults={'Sign up failed'} />
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert>
          <AlertTitle>Thanks!</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type={'submit'}
        className={'w-full'}
        disabled={
          isSubmitting ||
          ((signupMode === 'invite_only' || signupMode === 'closed') && !inviteToken)
        }
      >
        {isSubmitting ? (
          <Trans i18nKey={'auth:signingUp'} defaults={'Creating account...'} />
        ) : isWaitlistFlow ? (
          waitlistButtonLabel || 'Join waitlist'
        ) : (
          <Trans
            i18nKey={'auth:signUp'}
            defaults={'Create account'}
          />
        )}
      </Button>
    </form>
  );
}
