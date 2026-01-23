'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@kit/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kit/ui/table';

import { getAuthToken } from '~/lib/auth/client';

type TenantInfo = {
  tenant_id: string;
  name: string;
  slug: string;
  role: string;
  tenant_type: string;
  status: string;
  can_manage_customers?: boolean;
  branding?: {
    logo_url?: string | null;
  } | null;
  branding_logo_url?: string | null;
};

type ContactSettings = {
  primary_contact_name: string;
  primary_contact_email: string;
  support_email: string;
  phone: string;
  website: string;
};

type OrgUser = {
  id: string;
  email: string;
  username: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

type NewUserState = {
  email: string;
  username: string;
  role: string;
  first_name: string;
  last_name: string;
  password: string;
};

type WaitlistEntry = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
  invited_at: string | null;
  approved_at: string | null;
};

type IntegrationProvider = {
  slug: string;
  name: string;
  category?: string;
  auth_type?: string;
  authType?: string;
  mcpAvailable?: boolean;
  mcpEnabled?: boolean;
  oauthConfigured?: boolean;
};

const emptyContact: ContactSettings = {
  primary_contact_name: '',
  primary_contact_email: '',
  support_email: '',
  phone: '',
  website: ''
};

const emptyNewUser: NewUserState = {
  email: '',
  username: '',
  role: 'member',
  first_name: '',
  last_name: '',
  password: ''
};

const emptyOAuthApp = {
  clientId: '',
  clientSecret: '',
  environment: 'sandbox',
  scopes: '',
  redirectUris: ''
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  org_owner: 'Full access to tenant settings, users, and billing.',
  org_admin: 'Manage users and integrations without billing access.',
  member: 'Standard access to deployments and integrations.',
  viewer: 'Read-only access to deployments.'
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  org_owner: ['manage_organization', 'manage_users', 'manage_cloud_accounts', 'manage_billing'],
  org_admin: ['manage_users', 'manage_cloud_accounts'],
  member: ['read_cloud_accounts', 'request_access'],
  viewer: ['read_cloud_accounts']
};

function extractSettingValue(value: unknown) {
  if (value && typeof value === 'object' && 'value' in (value as { value?: unknown })) {
    return (value as { value?: unknown }).value ?? '';
  }

  return value ?? '';
}

export function SettingsClient() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [contact, setContact] = useState<ContactSettings>(emptyContact);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState('');
  const [integrationError, setIntegrationError] = useState('');
  const [brandingStatus, setBrandingStatus] = useState('');
  const [brandingError, setBrandingError] = useState('');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('');
  const [createError, setCreateError] = useState('');
  const [createStatus, setCreateStatus] = useState('');
  const [newUser, setNewUser] = useState<NewUserState>(emptyNewUser);
  const [newCredentials, setNewCredentials] = useState<{ apiKey: string; tempPassword?: string } | null>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('');
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState('');
  const [tenantMcps, setTenantMcps] = useState<string[]>([]);
  const [tenantMcpStatus, setTenantMcpStatus] = useState('');
  const [tenantMcpError, setTenantMcpError] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [oauthApp, setOauthApp] = useState(emptyOAuthApp);
  const [envPairs, setEnvPairs] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);
  const [restartGateway, setRestartGateway] = useState(true);
  const [restartAuth, setRestartAuth] = useState(false);

  const apiBase = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return 'https://api.execgpt.com';
  }, []);

  const cmsUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://cms.execgpt.com';

  const refreshUsers = async (tenantId: string, headers: HeadersInit) => {
    const usersResponse = await fetch(
      `${apiBase}/api/v1/tenants/${tenantId}/users`,
      { headers }
    );
    const usersPayload = await usersResponse.json();
    if (usersResponse.ok) {
      setUsers(usersPayload.users || []);
    }
  };

  const refreshWaitlist = async (headers: HeadersInit) => {
    setWaitlistLoading(true);
    setWaitlistError('');
    try {
      const response = await fetch(`${apiBase}/api/v1/auth/waitlist?status=pending`, { headers });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load waitlist.');
      }
      setWaitlistEntries(payload.entries || []);
    } catch (err) {
      setWaitlistError(err instanceof Error ? err.message : 'Failed to load waitlist.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const refreshTenantMcps = async (tenantId: string, headers: HeadersInit) => {
    try {
      const response = await fetch(`${apiBase}/api/v1/tenants/${tenantId}/mcps`, { headers });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load tenant MCPs.');
      }
      setTenantMcps(payload.enabled_mcps || []);
    } catch (err) {
      setTenantMcpError(err instanceof Error ? err.message : 'Failed to load tenant MCPs.');
    }
  };

  const refreshProviders = async (headers: HeadersInit) => {
    setProvidersLoading(true);
    setProvidersError('');
    try {
      const response = await fetch(`${apiBase}/api/v1/integrations/providers`, { headers });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load integration providers.');
      }
      const list = payload.providers || [];
      setProviders(list);
      if (!selectedService && list.length > 0) {
        setSelectedService(list[0].slug);
      }
    } catch (err) {
      setProvidersError(err instanceof Error ? err.message : 'Failed to load integration providers.');
    } finally {
      setProvidersLoading(false);
    }
  };

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
        const resolvedBrandingLogo =
          mePayload.branding_logo_url || mePayload.branding?.logo_url || '';
        setBrandingLogoUrl(resolvedBrandingLogo);
        const canManage = Boolean(
          mePayload.can_manage_customers || mePayload.role === 'platform'
        );

        const contactResponse = await fetch(
          `${apiBase}/api/v1/tenants/${mePayload.tenant_id}/settings/contact`,
          { headers }
        );
        const contactPayload = await contactResponse.json();
        if (contactResponse.ok && contactPayload?.settings) {
          setContact({
            primary_contact_name: String(
              extractSettingValue(contactPayload.settings.primary_contact_name)
            ),
            primary_contact_email: String(
              extractSettingValue(contactPayload.settings.primary_contact_email)
            ),
            support_email: String(
              extractSettingValue(contactPayload.settings.support_email)
            ),
            phone: String(
              extractSettingValue(contactPayload.settings.phone)
            ),
            website: String(
              extractSettingValue(contactPayload.settings.website)
            )
          });
        }

        await refreshUsers(mePayload.tenant_id, headers);
        if (canManage) {
          await refreshWaitlist(headers);
          await refreshProviders(headers);
          await refreshTenantMcps(mePayload.tenant_id, headers);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings.');
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
      const response = await fetch(
        `${apiBase}/api/v1/tenants/${tenant.tenant_id}/settings/contact`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ settings: contact })
        }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update contact info.');
      }
      setStatus('Contact information updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact info.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!tenant) {
      return;
    }

    setCreating(true);
    setCreateError('');
    setCreateStatus('');
    setNewCredentials(null);
    const token = getAuthToken();

    try {
      const response = await fetch(
        `${apiBase}/api/v1/tenants/${tenant.tenant_id}/users`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: newUser.email,
            username: newUser.username || undefined,
            role: newUser.role,
            first_name: newUser.first_name || undefined,
            last_name: newUser.last_name || undefined,
            password: newUser.password || undefined
          })
        }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create user.');
      }
      setCreateStatus('User created successfully.');
      setNewCredentials({
        apiKey: payload.api_key,
        tempPassword: payload.temporary_password
      });
      setNewUser(emptyNewUser);
      await refreshUsers(tenant.tenant_id, { Authorization: `Bearer ${token}` });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const handleApproveWaitlist = async (entryId: string) => {
    setWaitlistStatus('');
    setWaitlistError('');
    const token = getAuthToken();

    try {
      const response = await fetch(`${apiBase}/api/v1/auth/waitlist/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ waitlistId: entryId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send invite.');
      }

      setWaitlistStatus('Invite sent.');
      await refreshWaitlist({ Authorization: `Bearer ${token}` });
    } catch (err) {
      setWaitlistError(err instanceof Error ? err.message : 'Failed to send invite.');
    }
  };

  const handleBrandingSave = async () => {
    if (!tenant) {
      return;
    }

    setBrandingStatus('');
    setBrandingError('');
    const token = getAuthToken();

    try {
      const response = await fetch(
        `${apiBase}/api/v1/tenants/${tenant.tenant_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            branding: {
              logo_url: brandingLogoUrl || null
            }
          })
        }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update branding.');
      }
      setBrandingStatus('Branding updated.');
    } catch (err) {
      setBrandingError(err instanceof Error ? err.message : 'Failed to update branding.');
    }
  };

  const handleActivateIntegration = async () => {
    if (!selectedService) {
      setIntegrationError('Select an integration first.');
      return;
    }

    setActivating(true);
    setIntegrationStatus('');
    setIntegrationError('');
    const token = getAuthToken();

    const envPayload = envPairs.reduce<Record<string, string>>((acc, pair) => {
      if (pair.key.trim()) {
        acc[pair.key.trim()] = pair.value.trim();
      }
      return acc;
    }, {});

    const restartTargets: string[] = [];
    if (restartGateway) {
      restartTargets.push('execgpt-gateway');
    }
    if (restartAuth) {
      restartTargets.push('auth-service');
    }

    const body: Record<string, unknown> = {
      service: selectedService,
      env: envPayload,
      restartTargets
    };

    if (oauthApp.clientId.trim() && oauthApp.clientSecret.trim()) {
      body.oauthApp = {
        clientId: oauthApp.clientId.trim(),
        clientSecret: oauthApp.clientSecret.trim(),
        environment: oauthApp.environment || 'sandbox',
        scopes: oauthApp.scopes,
        redirectUris: oauthApp.redirectUris
          ? oauthApp.redirectUris.split(',').map((entry) => entry.trim()).filter(Boolean)
          : []
      };
    }

    try {
      const response = await fetch(`${apiBase}/api/v1/integrations/activate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to activate integration.');
      }
      setIntegrationStatus(`Integration ${selectedService} activated.`);
    } catch (err) {
      setIntegrationError(err instanceof Error ? err.message : 'Failed to activate integration.');
    } finally {
      setActivating(false);
    }
  };

  const handleToggleTenantMcp = async (mcpSlug: string, enabled: boolean) => {
    if (!tenant) {
      return;
    }
    setTenantMcpStatus('');
    setTenantMcpError('');
    const token = getAuthToken();

    try {
      const response = await fetch(
        `${apiBase}/api/v1/tenants/${tenant.tenant_id}/mcps/${mcpSlug}`,
        {
          method: enabled ? 'POST' : 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update tenant MCP.');
      }
      setTenantMcps(payload.enabled_mcps || []);
      setTenantMcpStatus(
        enabled ? `Enabled ${mcpSlug} for this tenant.` : `Disabled ${mcpSlug} for this tenant.`
      );
    } catch (err) {
      setTenantMcpError(err instanceof Error ? err.message : 'Failed to update tenant MCP.');
    }
  };

  const portalUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const tenantDomain = tenant?.slug ? `https://${tenant.slug}.execgpt.com` : '';
  const canManageCustomers = Boolean(
    tenant?.can_manage_customers || tenant?.role === 'platform',
  );
  const showCmsUrl = canManageCustomers;

  if (loading) {
    return (
      <div className={'rounded-xl border bg-card p-6 text-sm text-muted-foreground'}>
        Loading settings...
      </div>
    );
  }

  if (error) {
    return (
      <div className={'rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700'}>
        {error}
      </div>
    );
  }

  return (
    <div className={'space-y-8'}>
      <div className={'rounded-xl border bg-card p-6'}>
        <h3 className={'text-base font-semibold'}>Tenant Profile</h3>
        <p className={'text-sm text-muted-foreground'}>
          Review your ExecGPT tenant details and access URLs.
        </p>
        <div className={'mt-4 grid gap-4 text-sm md:grid-cols-2'}>
          <div>
            <div className={'text-xs uppercase text-muted-foreground'}>Tenant</div>
            <div className={'font-medium'}>{tenant?.name}</div>
            <div className={'text-muted-foreground'}>{tenant?.slug}</div>
          </div>
          <div>
            <div className={'text-xs uppercase text-muted-foreground'}>Status</div>
            <div className={'font-medium'}>{tenant?.status}</div>
            <div className={'text-muted-foreground'}>{tenant?.tenant_type}</div>
          </div>
          <div>
            <div className={'text-xs uppercase text-muted-foreground'}>Role</div>
            <div className={'font-medium'}>{tenant?.role}</div>
          </div>
        </div>
        <div className={'mt-6 grid gap-3 text-sm'}>
          <div>
            <span className={'text-xs uppercase text-muted-foreground'}>Portal URL</span>
            <div className={'font-medium'}>{portalUrl}</div>
          </div>
          <div>
            <span className={'text-xs uppercase text-muted-foreground'}>API Base</span>
            <div className={'font-medium'}>{apiBase}</div>
          </div>
          {showCmsUrl ? (
            <div>
              <span className={'text-xs uppercase text-muted-foreground'}>CMS URL</span>
              <div className={'font-medium'}>{cmsUrl}</div>
            </div>
          ) : null}
          <div>
            <span className={'text-xs uppercase text-muted-foreground'}>Tenant Domain</span>
            <div className={'font-medium'}>
              {tenantDomain || 'Will appear after DNS is configured.'}
            </div>
          </div>
        </div>
      </div>

      <div className={'rounded-xl border bg-card p-6'}>
        <h3 className={'text-base font-semibold'}>Contact Information</h3>
        <p className={'text-sm text-muted-foreground'}>
          Keep tenant contact details up to date for billing and support.
        </p>
        <div className={'mt-4 grid gap-4 md:grid-cols-2'}>
          <label className={'space-y-2 text-sm'}>
            <span className={'text-xs uppercase text-muted-foreground'}>Primary Contact</span>
            <input
              className={'w-full rounded-md border px-3 py-2'}
              value={contact.primary_contact_name}
              onChange={(event) =>
                setContact((prev) => ({
                  ...prev,
                  primary_contact_name: event.target.value
                }))
              }
            />
          </label>
          <label className={'space-y-2 text-sm'}>
            <span className={'text-xs uppercase text-muted-foreground'}>Primary Email</span>
            <input
              className={'w-full rounded-md border px-3 py-2'}
              value={contact.primary_contact_email}
              onChange={(event) =>
                setContact((prev) => ({
                  ...prev,
                  primary_contact_email: event.target.value
                }))
              }
            />
          </label>
          <label className={'space-y-2 text-sm'}>
            <span className={'text-xs uppercase text-muted-foreground'}>Support Email</span>
            <input
              className={'w-full rounded-md border px-3 py-2'}
              value={contact.support_email}
              onChange={(event) =>
                setContact((prev) => ({
                  ...prev,
                  support_email: event.target.value
                }))
              }
            />
          </label>
          <label className={'space-y-2 text-sm'}>
            <span className={'text-xs uppercase text-muted-foreground'}>Phone</span>
            <input
              className={'w-full rounded-md border px-3 py-2'}
              value={contact.phone}
              onChange={(event) =>
                setContact((prev) => ({
                  ...prev,
                  phone: event.target.value
                }))
              }
            />
          </label>
          <label className={'space-y-2 text-sm md:col-span-2'}>
            <span className={'text-xs uppercase text-muted-foreground'}>Website</span>
            <input
              className={'w-full rounded-md border px-3 py-2'}
              value={contact.website}
              onChange={(event) =>
                setContact((prev) => ({
                  ...prev,
                  website: event.target.value
                }))
              }
            />
          </label>
        </div>
        <div className={'mt-4 flex items-center gap-3'}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Contact Info'}
          </Button>
          {status ? <span className={'text-sm text-emerald-600'}>{status}</span> : null}
        </div>
      </div>

      {canManageCustomers ? (
        <div className={'rounded-xl border bg-card p-6'}>
          <h3 className={'text-base font-semibold'}>Branding</h3>
          <p className={'text-sm text-muted-foreground'}>
            Update the ExecGPT logo shown to your tenants. Use a public image URL.
          </p>
          <div className={'mt-4 grid gap-4 md:grid-cols-2'}>
            <label className={'space-y-2 text-sm md:col-span-2'}>
              <span className={'text-xs uppercase text-muted-foreground'}>Logo URL</span>
              <input
                className={'w-full rounded-md border px-3 py-2'}
                value={brandingLogoUrl}
                onChange={(event) => setBrandingLogoUrl(event.target.value)}
                placeholder={'https://cms.execgpt.com/uploads/logo.png'}
              />
            </label>
          </div>
          <div className={'mt-4 flex items-center gap-3'}>
            <Button onClick={handleBrandingSave}>Save Branding</Button>
            {brandingStatus ? (
              <span className={'text-sm text-emerald-600'}>{brandingStatus}</span>
            ) : null}
          </div>
          {brandingError ? (
            <div className={'mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'}>
              {brandingError}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={'rounded-xl border bg-card p-6'}>
        <h3 className={'text-base font-semibold'}>Users</h3>
        <p className={'text-sm text-muted-foreground'}>
          Manage users within your ExecGPT tenant organization.
        </p>
        <div className={'mt-4 rounded-lg border bg-muted/30 p-4'}>
          <div className={'text-sm font-medium'}>Invite User</div>
          <div className={'mt-3 grid gap-4 md:grid-cols-2'}>
            <label className={'space-y-2 text-sm'}>
              <span className={'text-xs uppercase text-muted-foreground'}>Email</span>
              <input
                className={'w-full rounded-md border px-3 py-2'}
                value={newUser.email}
                onChange={(event) =>
                  setNewUser((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </label>
            <label className={'space-y-2 text-sm'}>
              <span className={'text-xs uppercase text-muted-foreground'}>Username</span>
              <input
                className={'w-full rounded-md border px-3 py-2'}
                placeholder={'Optional'}
                value={newUser.username}
                onChange={(event) =>
                  setNewUser((prev) => ({ ...prev, username: event.target.value }))
                }
              />
            </label>
            <label className={'space-y-2 text-sm'}>
              <span className={'text-xs uppercase text-muted-foreground'}>First Name</span>
              <input
                className={'w-full rounded-md border px-3 py-2'}
                value={newUser.first_name}
                onChange={(event) =>
                  setNewUser((prev) => ({ ...prev, first_name: event.target.value }))
                }
              />
            </label>
            <label className={'space-y-2 text-sm'}>
              <span className={'text-xs uppercase text-muted-foreground'}>Last Name</span>
              <input
                className={'w-full rounded-md border px-3 py-2'}
                value={newUser.last_name}
                onChange={(event) =>
                  setNewUser((prev) => ({ ...prev, last_name: event.target.value }))
                }
              />
            </label>
            <label className={'space-y-2 text-sm'}>
              <span className={'text-xs uppercase text-muted-foreground'}>Role</span>
              <select
                className={'w-full rounded-md border px-3 py-2 text-sm'}
                value={newUser.role}
                onChange={(event) =>
                  setNewUser((prev) => ({ ...prev, role: event.target.value }))
                }
              >
                <option value={'org_owner'}>Org Owner</option>
                <option value={'org_admin'}>Org Admin</option>
                <option value={'member'}>Member</option>
                <option value={'viewer'}>Viewer</option>
              </select>
              <span className={'text-xs text-muted-foreground'}>
                {ROLE_DESCRIPTIONS[newUser.role]}
              </span>
            </label>
            <label className={'space-y-2 text-sm'}>
              <span className={'text-xs uppercase text-muted-foreground'}>Temporary Password</span>
              <input
                className={'w-full rounded-md border px-3 py-2'}
                placeholder={'Leave blank to auto-generate'}
                value={newUser.password}
                onChange={(event) =>
                  setNewUser((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </label>
          </div>
          <div className={'mt-4 flex items-center gap-3'}>
            <Button
              onClick={handleCreateUser}
              disabled={creating || !newUser.email.trim()}
            >
              {creating ? 'Creating...' : 'Create User'}
            </Button>
            {createStatus ? (
              <span className={'text-sm text-emerald-600'}>{createStatus}</span>
            ) : null}
          </div>
          {createError ? (
            <div className={'mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'}>
              {createError}
            </div>
          ) : null}
          {newCredentials ? (
            <div className={'mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm'}>
              <div className={'font-medium text-emerald-700'}>New user credentials</div>
              <div className={'mt-2 text-emerald-700'}>
                API Key: <span className={'font-mono'}>{newCredentials.apiKey}</span>
              </div>
              {newCredentials.tempPassword ? (
                <div className={'text-emerald-700'}>
                  Temporary Password:{' '}
                  <span className={'font-mono'}>{newCredentials.tempPassword}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className={'mt-4'}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : user.username}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.created_at?.slice(0, 10) || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className={'text-muted-foreground'}>
                    No users found for this tenant.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className={'mt-6'}>
          <div className={'text-sm font-medium'}>Role Permissions</div>
          <div className={'mt-2 grid gap-3 md:grid-cols-2'}>
            {Object.entries(ROLE_PERMISSIONS).map(([roleKey, permissions]) => (
              <div key={roleKey} className={'rounded-md border bg-muted/30 p-3 text-sm'}>
                <div className={'font-medium'}>
                  {roleKey.replace('_', ' ')}
                </div>
                <div className={'text-xs text-muted-foreground'}>
                  {ROLE_DESCRIPTIONS[roleKey] || 'Custom role'}
                </div>
                <div className={'mt-2 flex flex-wrap gap-2 text-xs'}>
                  {permissions.map((permission) => (
                    <span key={permission} className={'rounded-full border px-2 py-1'}>
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={'rounded-xl border bg-card p-6'}>
        <h3 className={'text-base font-semibold'}>Implementation</h3>
        <p className={'text-sm text-muted-foreground'}>
          Launch agent deployments and connect integrations for your end customers.
        </p>
        <div className={'mt-4 grid gap-3 text-sm'}>
          <div className={'font-medium'}>Deployment and Integrations</div>
          <div className={'text-muted-foreground'}>
            Use the Deployment Wizard and Integrations pages to configure agent rollouts.
          </div>
          <div className={'flex flex-wrap gap-3'}>
            <a className={'text-primary underline'} href={'/home/deployments'}>
              Open Deployments
            </a>
            <a className={'text-primary underline'} href={'/home/integrations'}>
              Open Integrations
            </a>
          </div>
          <div className={'mt-4 font-medium'}>API Endpoints</div>
          <div className={'space-y-1 text-muted-foreground'}>
            <div>{`${apiBase}/api/v1/tenants/me`}</div>
            <div>{`${apiBase}/api/v1/deploy/options`}</div>
            <div>{`${apiBase}/api/v1/integrations/providers`}</div>
          </div>
        </div>
      </div>

      {canManageCustomers ? (
        <div className={'rounded-xl border bg-card p-6'}>
          <h3 className={'text-base font-semibold'}>Self-Serve Integrations</h3>
          <p className={'text-sm text-muted-foreground'}>
            Configure OAuth apps and webhook secrets for reseller integrations.
          </p>
          <div className={'mt-4 grid gap-4'}>
            {providersLoading ? (
              <div className={'text-sm text-muted-foreground'}>Loading integrations...</div>
            ) : providersError ? (
              <div className={'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'}>
                {providersError}
              </div>
            ) : (
              <label className={'space-y-2 text-sm'}>
                <span className={'text-xs uppercase text-muted-foreground'}>Integration</span>
                <select
                  className={'w-full rounded-md border px-3 py-2 text-sm'}
                  value={selectedService}
                  onChange={(event) => setSelectedService(event.target.value)}
                >
                  {providers.map((provider) => (
                    <option key={provider.slug} value={provider.slug}>
                      {provider.name || provider.slug}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className={'rounded-md border bg-muted/30 p-4'}>
              <div className={'text-sm font-medium'}>OAuth App (optional)</div>
              <div className={'mt-3 grid gap-4 md:grid-cols-2'}>
                <label className={'space-y-2 text-sm'}>
                  <span className={'text-xs uppercase text-muted-foreground'}>Client ID</span>
                  <input
                    className={'w-full rounded-md border px-3 py-2'}
                    value={oauthApp.clientId}
                    onChange={(event) =>
                      setOauthApp((prev) => ({ ...prev, clientId: event.target.value }))
                    }
                  />
                </label>
                <label className={'space-y-2 text-sm'}>
                  <span className={'text-xs uppercase text-muted-foreground'}>Client Secret</span>
                  <input
                    className={'w-full rounded-md border px-3 py-2'}
                    value={oauthApp.clientSecret}
                    onChange={(event) =>
                      setOauthApp((prev) => ({ ...prev, clientSecret: event.target.value }))
                    }
                  />
                </label>
                <label className={'space-y-2 text-sm'}>
                  <span className={'text-xs uppercase text-muted-foreground'}>Environment</span>
                  <select
                    className={'w-full rounded-md border px-3 py-2 text-sm'}
                    value={oauthApp.environment}
                    onChange={(event) =>
                      setOauthApp((prev) => ({ ...prev, environment: event.target.value }))
                    }
                  >
                    <option value={'sandbox'}>Sandbox</option>
                    <option value={'production'}>Production</option>
                  </select>
                </label>
                <label className={'space-y-2 text-sm'}>
                  <span className={'text-xs uppercase text-muted-foreground'}>Scopes (comma-separated)</span>
                  <input
                    className={'w-full rounded-md border px-3 py-2'}
                    value={oauthApp.scopes}
                    onChange={(event) =>
                      setOauthApp((prev) => ({ ...prev, scopes: event.target.value }))
                    }
                  />
                </label>
                <label className={'space-y-2 text-sm md:col-span-2'}>
                  <span className={'text-xs uppercase text-muted-foreground'}>
                    Redirect URIs (comma-separated)
                  </span>
                  <input
                    className={'w-full rounded-md border px-3 py-2'}
                    value={oauthApp.redirectUris}
                    onChange={(event) =>
                      setOauthApp((prev) => ({ ...prev, redirectUris: event.target.value }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className={'rounded-md border bg-muted/30 p-4'}>
              <div className={'text-sm font-medium'}>Enable MCPs for Tenant</div>
              <div className={'mt-3 grid gap-2 md:grid-cols-2'}>
                {providers
                  .filter((provider) => provider.mcpAvailable)
                  .map((provider) => {
                    const enabled = tenantMcps.includes(provider.slug);
                    return (
                      <label
                        key={provider.slug}
                        className={'flex items-center justify-between rounded-md border px-3 py-2 text-sm'}
                      >
                        <span>{provider.name}</span>
                        <input
                          type={'checkbox'}
                          checked={enabled}
                          onChange={(event) =>
                            handleToggleTenantMcp(provider.slug, event.target.checked)
                          }
                        />
                      </label>
                    );
                  })}
              </div>
              {tenantMcpStatus ? (
                <div className={'mt-2 text-sm text-emerald-600'}>{tenantMcpStatus}</div>
              ) : null}
              {tenantMcpError ? (
                <div className={'mt-2 text-sm text-red-600'}>{tenantMcpError}</div>
              ) : null}
            </div>

            <div className={'rounded-md border bg-muted/30 p-4'}>
              <div className={'text-sm font-medium'}>Env Secrets</div>
              <div className={'mt-3 space-y-3'}>
                {envPairs.map((pair, index) => (
                  <div key={`${pair.key}-${index}`} className={'grid gap-3 md:grid-cols-2'}>
                    <input
                      className={'w-full rounded-md border px-3 py-2 text-sm'}
                      placeholder={'ENV_KEY'}
                      value={pair.key}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEnvPairs((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, key: value } : item))
                        );
                      }}
                    />
                    <input
                      className={'w-full rounded-md border px-3 py-2 text-sm'}
                      placeholder={'Value'}
                      value={pair.value}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEnvPairs((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, value } : item))
                        );
                      }}
                    />
                    <div className={'md:col-span-2 flex justify-end'}>
                      <Button
                        size={'sm'}
                        variant={'outline'}
                        onClick={() =>
                          setEnvPairs((prev) => prev.filter((_, idx) => idx !== index))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  size={'sm'}
                  variant={'outline'}
                  onClick={() => setEnvPairs((prev) => [...prev, { key: '', value: '' }])}
                >
                  Add Env Row
                </Button>
              </div>
            </div>

            <div className={'flex flex-wrap items-center gap-4 text-sm'}>
              <label className={'flex items-center gap-2'}>
                <input
                  type={'checkbox'}
                  checked={restartGateway}
                  onChange={(event) => setRestartGateway(event.target.checked)}
                />
                Restart gateway
              </label>
              <label className={'flex items-center gap-2'}>
                <input
                  type={'checkbox'}
                  checked={restartAuth}
                  onChange={(event) => setRestartAuth(event.target.checked)}
                />
                Restart auth-service
              </label>
            </div>

            <div className={'flex items-center gap-3'}>
              <Button onClick={handleActivateIntegration} disabled={activating || !selectedService}>
                {activating ? 'Activating...' : 'Activate Integration'}
              </Button>
              {integrationStatus ? (
                <span className={'text-sm text-emerald-600'}>{integrationStatus}</span>
              ) : null}
            </div>
            {integrationError ? (
              <div className={'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'}>
                {integrationError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {canManageCustomers ? (
        <div className={'rounded-xl border bg-card p-6'}>
          <h3 className={'text-base font-semibold'}>Waitlist</h3>
          <p className={'text-sm text-muted-foreground'}>
            Review waitlist signups and send invitations.
          </p>

          <div className={'mt-4'}>
            {waitlistLoading ? (
              <div className={'text-sm text-muted-foreground'}>Loading waitlist...</div>
            ) : waitlistEntries.length === 0 ? (
              <div className={'rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground'}>
                No pending waitlist entries.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className={'text-right'}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlistEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className={'font-medium'}>
                        {entry.email}
                      </TableCell>
                      <TableCell>{entry.status}</TableCell>
                      <TableCell>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className={'text-right'}>
                        <Button
                          size={'sm'}
                          onClick={() => handleApproveWaitlist(entry.id)}
                        >
                          Send Invite
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {waitlistStatus ? (
            <div className={'mt-3 text-sm text-emerald-600'}>{waitlistStatus}</div>
          ) : null}
          {waitlistError ? (
            <div className={'mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'}>
              {waitlistError}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
