'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@kit/ui/button';

import { getAuthToken } from '~/lib/auth/client';

type TenantInfo = {
  tenant_id: string;
  role: string;
  can_manage_customers?: boolean;
  tenant_role?: string | null;
  branding?: {
    logo_url?: string | null;
  } | null;
  branding_logo_url?: string | null;
};

export function BrandingClient() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const apiBase = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return 'https://api.execgpt.com';
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !apiBase) {
      setError('Missing auth token or API base URL.');
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      try {
        const meResponse = await fetch(`${apiBase}/api/v1/tenants/me`, { headers });
        const mePayload = await meResponse.json();
        if (!meResponse.ok) {
          throw new Error(mePayload?.error || 'Failed to load tenant profile.');
        }

        setTenant(mePayload);
        const resolvedLogo =
          mePayload.branding_logo_url || mePayload.branding?.logo_url || '';
        setLogoUrl(resolvedLogo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load branding.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [apiBase]);

  const handleSave = async () => {
    if (!tenant) {
      return;
    }

    setSaving(true);
    setStatus('');
    setError('');
    const token = getAuthToken();

    try {
      const response = await fetch(`${apiBase}/api/v1/tenants/${tenant.tenant_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branding: {
            logo_url: logoUrl || null,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update branding.');
      }
      setStatus('Branding updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={'rounded-xl border bg-card p-6'}>
        <p className={'text-sm text-muted-foreground'}>Loading branding settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'}>
        {error}
      </div>
    );
  }

  const canManageBranding = Boolean(
    tenant?.can_manage_customers || tenant?.tenant_role === 'admin' || tenant?.role === 'platform',
  );

  if (!canManageBranding) {
    return (
      <div className={'rounded-xl border bg-card p-6'}>
        <p className={'text-sm text-muted-foreground'}>
          You do not have permission to update branding settings.
        </p>
      </div>
    );
  }

  return (
    <div className={'rounded-xl border bg-card p-6'}>
      <h3 className={'text-base font-semibold'}>Logo</h3>
      <p className={'text-sm text-muted-foreground'}>
        Update the ExecGPT logo shown to your tenants. Use a public image URL.
      </p>
      <div className={'mt-4 grid gap-4 md:grid-cols-2'}>
        <label className={'space-y-2 text-sm md:col-span-2'}>
          <span className={'text-xs uppercase text-muted-foreground'}>Logo URL</span>
          <input
            className={'w-full rounded-md border px-3 py-2'}
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder={'https://cms.execgpt.com/uploads/logo.png'}
          />
        </label>
      </div>
      <div className={'mt-4 flex items-center gap-3'}>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Branding'}
        </Button>
        {status ? <span className={'text-sm text-emerald-600'}>{status}</span> : null}
      </div>
    </div>
  );
}
