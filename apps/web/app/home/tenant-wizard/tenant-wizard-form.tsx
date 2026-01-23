'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@kit/ui/button';

import { getAuthToken } from '~/lib/auth/client';
type DeploymentOption = {
  type: string;
  name: string;
};

type FormLabels = {
  apiKeyLabel?: string;
  nameLabel?: string;
  emailLabel?: string;
  subdomainLabel?: string;
  deploymentTypeLabel?: string;
  ctaLabel?: string;
};

type CustomerProvisioningResult = {
  id?: string;
  name?: string;
  slug?: string;
  email?: string;
  access?: {
    api_key?: string;
    access_url?: string;
    ws_url?: string;
  };
  embed_code?: string;
};

export function TenantWizardForm(props: {
  options: DeploymentOption[];
  labels?: FormLabels;
}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.execgpt.com';
  const [apiKey, setApiKey] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerSubdomain, setCustomerSubdomain] = useState('');
  const [deploymentType, setDeploymentType] = useState(
    props.options[0]?.type || 'embedded_widget',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CustomerProvisioningResult | null>(null);
  const [hasSessionToken, setHasSessionToken] = useState(false);

  const canSubmit = useMemo(() => {
    const hasIdentity = customerEmail.trim() || customerSubdomain.trim();
    if (hasSessionToken) {
      return Boolean(hasIdentity);
    }
    return apiKey.trim().length > 0 && Boolean(hasIdentity);
  }, [apiKey, customerEmail, customerSubdomain, hasSessionToken]);

  useEffect(() => {
    setHasSessionToken(Boolean(getAuthToken()));
  }, []);

  const labels = {
    apiKeyLabel: 'Reseller API Key',
    nameLabel: 'Customer Name',
    emailLabel: 'Customer Email',
    subdomainLabel: 'Subdomain (optional)',
    deploymentTypeLabel: 'Deployment Type',
    ctaLabel: 'Create Tenant',
    ...props.labels,
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(hasSessionToken
        ? 'Provide either email or subdomain.'
        : 'Provide an API key and either email or subdomain.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult(null);

    try {
      const sessionToken = getAuthToken();
      const response = await fetch(`${apiBase}/api/v1/tenants/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken || apiKey}`,
        },
        body: JSON.stringify({
          email: customerEmail || undefined,
          name: customerName || undefined,
          subdomain: customerSubdomain || undefined,
          metadata: {
            deployment_type: deploymentType,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to provision customer.');
      }

      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={'space-y-4 rounded-xl border bg-card p-6'} onSubmit={handleSubmit}>
      {hasSessionToken ? (
        <div className={'rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground'}>
          Using your signed-in ExecGPT session.
        </div>
      ) : (
        <div className={'space-y-2'}>
          <label className={'text-muted-foreground text-xs uppercase tracking-wide'}>
            {labels.apiKeyLabel}
          </label>
          <input
            className={'w-full rounded-md border px-3 py-2 text-sm'}
            placeholder={'bb_execgpt_...'}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
      )}

      <div className={'grid gap-4 md:grid-cols-2'}>
        <div className={'space-y-2'}>
          <label className={'text-muted-foreground text-xs uppercase tracking-wide'}>
            {labels.nameLabel}
          </label>
          <input
            className={'w-full rounded-md border px-3 py-2 text-sm'}
            placeholder={'Acme Inc.'}
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        </div>
        <div className={'space-y-2'}>
          <label className={'text-muted-foreground text-xs uppercase tracking-wide'}>
            {labels.emailLabel}
          </label>
          <input
            className={'w-full rounded-md border px-3 py-2 text-sm'}
            placeholder={'ops@acme.com'}
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
          />
        </div>
      </div>

      <div className={'grid gap-4 md:grid-cols-2'}>
        <div className={'space-y-2'}>
          <label className={'text-muted-foreground text-xs uppercase tracking-wide'}>
            {labels.subdomainLabel}
          </label>
          <input
            className={'w-full rounded-md border px-3 py-2 text-sm'}
            placeholder={'acme'}
            value={customerSubdomain}
            onChange={(event) => setCustomerSubdomain(event.target.value)}
          />
        </div>
        <div className={'space-y-2'}>
          <label className={'text-muted-foreground text-xs uppercase tracking-wide'}>
            {labels.deploymentTypeLabel}
          </label>
          <select
            className={'w-full rounded-md border px-3 py-2 text-sm'}
            value={deploymentType}
            onChange={(event) => setDeploymentType(event.target.value)}
          >
            {props.options.map((option) => (
              <option key={option.type} value={option.type}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button type={'submit'} disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? 'Provisioning...' : labels.ctaLabel}
      </Button>

      {error ? (
        <div className={'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div className={'space-y-2 rounded-md border bg-muted/40 px-4 py-3 text-sm'}>
          <div className={'font-medium'}>Tenant Created</div>
          <div>Tenant: {result.name || result.slug || 'New tenant'}</div>
          <div>Access URL: {result.access?.access_url || 'Pending domain mapping'}</div>
          {result.access?.api_key ? (
            <div>Customer API Key: {result.access.api_key}</div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
