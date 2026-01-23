'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';

import { getAuthToken } from '~/lib/auth/client';

type IntegrationProvider = {
  id?: string;
  slug: string;
  name: string;
  category?: string;
  authType: 'oauth2' | 'apikey';
  configured: boolean;
  description?: string;
  mcpAvailable?: boolean;
  mcpEnabled?: boolean;
};

type ConnectedService = {
  id: string;
  service: string;
  name: string;
  status: string;
  connectionStatus: string;
  lastSyncAt?: string | null;
  mcpEnabled?: boolean;
};

type QuickBooksDiagnostics = {
  status: 'ready' | 'missing_credentials' | 'missing_provider';
  connectionStatus?: string;
  credentialTier?: string | null;
  missingFields?: string[];
  hasAccessToken?: boolean;
  hasRefreshToken?: boolean;
  hasClientId?: boolean;
  hasClientSecret?: boolean;
  hasRealmId?: boolean;
  nextSteps?: string[];
  authType?: 'oauth2' | 'apikey' | null;
  mcpAvailable?: boolean;
  mcpEnabled?: boolean;
  hasApiKey?: boolean;
};

type IntegrationDiagnosticsItem = {
  service: string;
  name: string;
  diagnostics: QuickBooksDiagnostics;
};

const POPULAR_SERVICES: Array<{ slug: string; name: string; category: string; emoji: string }> = [
  { slug: 'stripe', name: 'Stripe', category: 'Payment', emoji: '💳' },
  { slug: 'slack', name: 'Slack', category: 'Communication', emoji: '💬' },
  { slug: 'github', name: 'GitHub', category: 'Development', emoji: '🐙' },
  { slug: 'openai', name: 'OpenAI', category: 'AI', emoji: '🤖' },
  { slug: 'google-workspace', name: 'Google Workspace', category: 'Productivity', emoji: '📧' },
  { slug: 'salesforce', name: 'Salesforce', category: 'CRM', emoji: '☁️' },
  { slug: 'hubspot', name: 'HubSpot', category: 'CRM', emoji: '🧲' },
  { slug: 'gmail', name: 'Gmail', category: 'Productivity', emoji: '✉️' },
  { slug: 'quickbooks', name: 'QuickBooks', category: 'Accounting', emoji: '📒' },
  { slug: 'postgresql', name: 'PostgreSQL', category: 'Database', emoji: '🧱' },
];

function normalizeProvider(provider: IntegrationProvider | null) {
  if (!provider) {
    return null;
  }

  return {
    ...provider,
    authType: provider.authType || 'apikey',
    configured: provider.configured ?? false,
    mcpAvailable: provider.mcpAvailable ?? false,
    mcpEnabled: provider.mcpEnabled ?? false,
  };
}

function getEmoji(slug: string) {
  const match = POPULAR_SERVICES.find((service) => service.slug === slug);
  return match?.emoji ?? '🔗';
}

export function IntegrationsPanel() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.execgpt.com';
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [connected, setConnected] = useState<ConnectedService[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discovered, setDiscovered] = useState<IntegrationProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [mcpActionIds, setMcpActionIds] = useState<Record<string, boolean>>({});
  const [showOAuthSetupModal, setShowOAuthSetupModal] = useState(false);
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [oauthEnvironment, setOauthEnvironment] = useState('sandbox');
  const [oauthScopes, setOauthScopes] = useState('com.intuit.quickbooks.accounting');
  const [quickbooksDiagnostics, setQuickbooksDiagnostics] = useState<QuickBooksDiagnostics | null>(null);
  const [mcpDiagnostics, setMcpDiagnostics] = useState<IntegrationDiagnosticsItem[]>([]);
  const [oauthStatusMessage, setOauthStatusMessage] = useState<string | null>(null);
  const [oauthStatusVariant, setOauthStatusVariant] = useState<'success' | 'error' | null>(null);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const autoRefreshAttempted = useRef(false);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const token = useMemo(() => getAuthToken(), []);

  const fetchWithAuth = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
  }, [token]);

  const loadProviders = useCallback(async () => {
    const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/providers`);
    if (!response.ok) {
      throw new Error('Unable to load integration providers.');
    }
    const payload = await response.json();
    const list = Array.isArray(payload?.providers) ? payload.providers : [];
    return list.map(normalizeProvider).filter(Boolean) as IntegrationProvider[];
  }, [apiBase, fetchWithAuth]);

  const loadTenant = useCallback(async () => {
    const response = await fetchWithAuth(`${apiBase}/api/v1/tenants/me`);
    if (!response.ok) {
      throw new Error('Unable to load tenant info.');
    }
    const payload = await response.json();
    const id = payload?.tenant_id || null;
    setTenantId(id);
    return id;
  }, [apiBase, fetchWithAuth]);

  const loadConnected = useCallback(async () => {
    const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/connected-services`);
    if (!response.ok) {
      throw new Error('Unable to load connected services.');
    }
    const payload = await response.json();
    return Array.isArray(payload?.services) ? payload.services : [];
  }, [apiBase, fetchWithAuth]);

  const loadQuickBooksDiagnostics = useCallback(async () => {
    const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/diagnostics/quickbooks`);
    if (!response.ok) {
      throw new Error('Unable to load QuickBooks diagnostics.');
    }
    const payload = await response.json();
    return payload?.diagnostics as QuickBooksDiagnostics | undefined;
  }, [apiBase, fetchWithAuth]);

  const loadMcpDiagnostics = useCallback(async () => {
    const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/diagnostics?mcpOnly=true`);
    if (!response.ok) {
      throw new Error('Unable to load MCP diagnostics.');
    }
    const payload = await response.json();
    return Array.isArray(payload?.diagnostics) ? payload.diagnostics : [];
  }, [apiBase, fetchWithAuth]);

  const refreshOAuthToken = useCallback(async (service: string, currentTenantId?: string | null, silent = false) => {
    if (!service) {
      return;
    }
    const tenantValue = currentTenantId || tenantId;
    setIsRefreshingToken(true);
    try {
      setError('');
      const response = await fetchWithAuth(`${apiBase}/api/v1/oauth/refresh/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantValue ? { 'x-tenant-id': tenantValue } : {}),
        },
        body: JSON.stringify({ tenant_id: tenantValue }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Token refresh failed.');
      }
      if (!silent) {
        setOauthStatusVariant('success');
        setOauthStatusMessage(`Refreshed ${service} token. Start a new chat session to apply.`);
      }
      await refreshRef.current();
    } catch (err) {
      if (!silent) {
        setOauthStatusVariant('error');
        setOauthStatusMessage(err instanceof Error ? err.message : 'Token refresh failed.');
      }
    } finally {
      setIsRefreshingToken(false);
    }
  }, [apiBase, fetchWithAuth, tenantId]);

  const maybeAutoRefreshQuickBooks = useCallback(async (currentTenantId?: string | null) => {
    if (autoRefreshAttempted.current) {
      return;
    }
    autoRefreshAttempted.current = true;
    const tenantValue = currentTenantId || tenantId;
    try {
      const response = await fetchWithAuth(`${apiBase}/api/v1/oauth/token-status/quickbooks`, {
        headers: tenantValue ? { 'x-tenant-id': tenantValue } : undefined,
      });
      const payload = await response.json();
      if (!response.ok) {
        return;
      }
      if (payload?.status === 'expired' && payload?.refresh_available) {
        await refreshOAuthToken('quickbooks', tenantValue, true);
      }
    } catch {
      // Ignore auto-refresh failures; user can trigger manual refresh.
    }
  }, [apiBase, fetchWithAuth, refreshOAuthToken, tenantId]);

  const refresh = useCallback(async () => {
    if (!token) {
      setError('Please sign in to manage integrations.');
      setIsLoading(false);
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const [tenantValue, providersResult, connectedResult, quickbooksResult, mcpDiagnosticsResult] = await Promise.all([
        loadTenant(),
        loadProviders(),
        loadConnected(),
        loadQuickBooksDiagnostics(),
        loadMcpDiagnostics(),
      ]);
      setProviders(providersResult);
      setConnected(connectedResult);
      setQuickbooksDiagnostics(quickbooksResult || null);
      setMcpDiagnostics(mcpDiagnosticsResult);
      if (quickbooksResult?.status === 'ready') {
        await maybeAutoRefreshQuickBooks(tenantValue || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load integrations.');
    } finally {
      setIsLoading(false);
    }
  }, [token, loadTenant, loadProviders, loadConnected, loadQuickBooksDiagnostics, loadMcpDiagnostics]);

  const openOAuthSetup = useCallback((provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    setOauthClientId('');
    setOauthClientSecret('');
    setOauthEnvironment('sandbox');
    setOauthScopes(provider.slug === 'quickbooks' ? 'com.intuit.quickbooks.accounting' : '');
    setShowOAuthSetupModal(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const service = params.get('service');
    if (!status || !service) {
      return;
    }
    if (status === 'connected') {
      setOauthStatusVariant('success');
      setOauthStatusMessage(`Connected ${service}. Refreshing readiness...`);
      void refresh();
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.location.href = '/home/integrations?status=connected&service=' + encodeURIComponent(service);
        } catch (error) {
          window.opener.location.reload();
        }
        window.close();
      }
    } else if (status === 'error') {
      setOauthStatusVariant('error');
      setOauthStatusMessage(`OAuth failed for ${service}. Please retry.`);
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.location.href = '/home/integrations?status=error&service=' + encodeURIComponent(service);
        } catch (error) {
          window.opener.location.reload();
        }
        window.close();
      }
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('status');
    url.searchParams.delete('service');
    window.history.replaceState({}, '', url.toString());
  }, [refresh]);

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) {
      return providers;
    }
    const query = searchQuery.toLowerCase();
    return providers.filter((provider) =>
      provider.name.toLowerCase().includes(query) ||
      provider.slug.toLowerCase().includes(query)
    );
  }, [providers, searchQuery]);

  const quickbooksProvider = useMemo(
    () => providers.find((provider) => provider.slug === 'quickbooks') ?? null,
    [providers],
  );

  const quickbooksStatusLabel = useMemo(() => {
    if (!quickbooksDiagnostics) {
      return 'Diagnostics unavailable';
    }
    switch (quickbooksDiagnostics.status) {
      case 'ready':
        return 'Ready';
      case 'missing_credentials':
        return 'Missing credentials';
      case 'missing_provider':
        return 'Provider missing';
      default:
        return 'Needs attention';
    }
  }, [quickbooksDiagnostics]);

  const getDiagnosticsStatusLabel = (status?: string) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'missing_credentials':
        return 'Missing credentials';
      case 'missing_provider':
        return 'Provider missing';
      default:
        return 'Needs attention';
    }
  };

  const handleDiscover = async () => {
    if (!searchQuery.trim()) {
      setDiscovered(null);
      return;
    }

    try {
      setError('');
      const response = await fetchWithAuth(`${apiBase}/api/v1/discovery/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceName: searchQuery.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Discovery failed.');
      }
      setDiscovered(normalizeProvider(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed.');
    }
  };

  const handleSubmitOAuth = async (provider: IntegrationProvider) => {
    setIsSubmitting(true);
    try {
      setError('');
      const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: provider.slug,
          type: 'oauth',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to start OAuth connection.');
      }

      if (!payload?.authUrl) {
        throw new Error('OAuth URL is missing from the response.');
      }

      const popup = window.open(
        payload.authUrl,
        'oauth_connect',
        'width=520,height=720,menubar=no,toolbar=no,location=no,status=no'
      );
      if (!popup) {
        window.location.assign(payload.authUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start OAuth connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnect = (provider: IntegrationProvider) => {
    if (provider.authType === 'apikey') {
      setSelectedProvider(provider);
      setApiKey('');
      setShowApiKeyModal(true);
      return;
    }

    if (!provider.configured) {
      openOAuthSetup(provider);
      return;
    }

    setSelectedProvider(provider);
    setShowApiKeyModal(false);
    void handleSubmitOAuth(provider);
  };

  const handleSubmitApiKey = async () => {
    if (!selectedProvider) {
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter an API key.');
      return;
    }

    setIsSubmitting(true);
    try {
      setError('');
      const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: selectedProvider.slug,
          type: 'apikey',
          credentials: {
            apiKey,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to connect service.');
      }

      setShowApiKeyModal(false);
      setSelectedProvider(null);
      setApiKey('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOAuthApp = async () => {
    if (!selectedProvider) {
      return;
    }
    if (!oauthClientId.trim() || !oauthClientSecret.trim()) {
      setError('Client ID and Client Secret are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      setError('');
      const redirectUri = `${apiBase}/api/v1/oauth/${selectedProvider.slug}/callback`;
      const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/oauth-apps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: selectedProvider.slug,
          clientId: oauthClientId.trim(),
          clientSecret: oauthClientSecret.trim(),
          environment: oauthEnvironment,
          scopes: oauthScopes,
          redirectUris: [redirectUri],
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to configure OAuth app.');
      }

      setShowOAuthSetupModal(false);
      const provider = selectedProvider;
      setSelectedProvider(null);
      await refresh();
      await handleSubmitOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure OAuth app.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (serviceId: string) => {
    setIsSubmitting(true);
    try {
      setError('');
      const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/disconnect/${serviceId}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to disconnect service.');
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMcp = async (serviceSlug: string, enable: boolean) => {
    if (!tenantId) {
      setError('Tenant information is missing. Refresh and try again.');
      return;
    }

    setMcpActionIds((prev) => ({ ...prev, [serviceSlug]: true }));
    try {
      setError('');
      const response = await fetchWithAuth(`${apiBase}/api/v1/tenants/${tenantId}/mcps/${serviceSlug}`, {
        method: enable ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'integration-toggle' }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update MCP.');
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update MCP.');
    } finally {
      setMcpActionIds((prev) => ({ ...prev, [serviceSlug]: false }));
    }
  };

  return (
    <div className={'space-y-8'}>
      {error ? (
        <Alert variant={'destructive'}>
          <AlertTitle>Integration error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {oauthStatusMessage ? (
        <Alert variant={oauthStatusVariant === 'error' ? 'destructive' : 'default'}>
          <AlertTitle>OAuth status</AlertTitle>
          <AlertDescription>{oauthStatusMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Discover & Connect Services</CardTitle>
          <CardDescription>Search for a service or choose from popular integrations.</CardDescription>
        </CardHeader>
        <CardContent className={'space-y-4'}>
          <div className={'flex flex-col gap-3 md:flex-row md:items-center'}>
            <Input
              placeholder={'Enter service name (e.g., Stripe, Slack)'}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Button type={'button'} onClick={handleDiscover} disabled={isLoading}>
              Discover
            </Button>
          </div>
          {discovered ? (
            <div className={'rounded-lg border p-4'}>
              <div className={'flex items-center justify-between'}>
                <div>
                  <div className={'text-sm text-muted-foreground'}>Discovered Service</div>
                  <div className={'text-base font-semibold'}>{discovered.name}</div>
                  <div className={'text-xs text-muted-foreground'}>{discovered.slug}</div>
                </div>
                <Button type={'button'} onClick={() => handleConnect(discovered)}>
                  Connect
                </Button>
              </div>
            </div>
          ) : null}
          <div className={'grid gap-4 md:grid-cols-2 xl:grid-cols-3'}>
            {POPULAR_SERVICES.map((service) => {
              const provider = providers.find((entry) => entry.slug === service.slug);
              const display = provider ?? {
                slug: service.slug,
                name: service.name,
                category: service.category,
                authType: 'apikey',
                configured: false,
              };
              const isConnected = connected.some((item) => item.service === service.slug);
              return (
                <button
                  key={service.slug}
                  type={'button'}
                  className={'flex items-center justify-between rounded-lg border p-4 text-left transition hover:border-primary'}
                  onClick={() => !isConnected && handleConnect(display)}
                  disabled={isConnected}
                >
                  <div>
                    <div className={'text-2xl'}>{service.emoji}</div>
                    <div className={'mt-2 font-medium'}>{display.name}</div>
                    <div className={'text-xs text-muted-foreground'}>{display.category}</div>
                    {display.mcpAvailable ? (
                      <div className={'text-[11px] text-muted-foreground'}>MCP ready</div>
                    ) : null}
                  </div>
                  {isConnected ? (
                    <Badge variant={'success'}>Connected</Badge>
                  ) : (
                    <Badge variant={'outline'}>
                      {display.authType === 'oauth2' ? 'OAuth' : 'API Key'}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QuickBooks readiness</CardTitle>
          <CardDescription>Verify credentials, OAuth setup, and MCP availability for this tenant.</CardDescription>
        </CardHeader>
        <CardContent className={'space-y-4'}>
          {!quickbooksDiagnostics ? (
            <div className={'text-sm text-muted-foreground'}>
              Diagnostics are unavailable. Refresh to retry.
            </div>
          ) : (
            <div className={'space-y-3'}>
              <div className={'flex flex-wrap items-center gap-2'}>
                <Badge
                  variant={quickbooksDiagnostics.status === 'ready' ? 'success' : 'outline'}
                >
                  {quickbooksStatusLabel}
                </Badge>
                <Badge variant={'outline'}>
                  Connection: {quickbooksDiagnostics.connectionStatus || 'unknown'}
                </Badge>
                {quickbooksDiagnostics.credentialTier ? (
                  <Badge variant={'outline'}>
                    Tier: {quickbooksDiagnostics.credentialTier}
                  </Badge>
                ) : null}
              </div>

              {quickbooksDiagnostics.missingFields?.length ? (
                <div className={'rounded-lg border border-dashed p-3 text-sm'}>
                  <div className={'font-semibold'}>Missing credentials</div>
                  <div className={'mt-2 flex flex-wrap gap-2'}>
                    {quickbooksDiagnostics.missingFields.map((field) => (
                      <Badge key={field} variant={'outline'}>
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={'text-sm text-muted-foreground'}>
                  All required QuickBooks credentials are present.
                </div>
              )}

              {quickbooksDiagnostics.nextSteps?.length ? (
                <div className={'rounded-lg border bg-muted/40 p-3 text-sm'}>
                  <div className={'font-semibold'}>Next steps</div>
                  <ol className={'mt-2 list-decimal space-y-1 pl-5 text-xs text-muted-foreground'}>
                    {quickbooksDiagnostics.nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className={'flex flex-wrap items-center gap-2'}>
                <Button
                  type={'button'}
                  variant={'outline'}
                  onClick={() => {
                    if (quickbooksProvider) {
                      handleConnect(quickbooksProvider);
                    }
                  }}
                  disabled={!quickbooksProvider || isSubmitting}
                >
                  {quickbooksProvider?.configured ? 'Connect QuickBooks' : 'Set up QuickBooks OAuth'}
                </Button>
                {quickbooksProvider?.configured ? (
                  <Button
                    type={'button'}
                    variant={'ghost'}
                    onClick={() => {
                      if (quickbooksProvider) {
                        handleConnect(quickbooksProvider);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    Reconnect / switch company
                  </Button>
                ) : null}
                {quickbooksProvider?.authType === 'oauth2' && quickbooksProvider?.configured ? (
                  <Button
                    type={'button'}
                    variant={'ghost'}
                    onClick={() => openOAuthSetup(quickbooksProvider)}
                    disabled={isSubmitting}
                  >
                    Update OAuth App
                  </Button>
                ) : null}
                <Button
                  type={'button'}
                  variant={'ghost'}
                  onClick={() => void refreshOAuthToken('quickbooks')}
                  disabled={isRefreshingToken}
                >
                  {isRefreshingToken ? 'Refreshing...' : 'Refresh token'}
                </Button>
                <Button
                  type={'button'}
                  variant={'ghost'}
                  onClick={() => refresh()}
                  disabled={isSubmitting}
                >
                  Refresh readiness
                </Button>
                {quickbooksProvider?.mcpAvailable ? (
                  <Badge variant={quickbooksProvider.mcpEnabled ? 'success' : 'outline'}>
                    MCP {quickbooksProvider.mcpEnabled ? 'enabled' : 'disabled'}
                  </Badge>
                ) : (
                  <Badge variant={'outline'}>MCP not enabled</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MCP diagnostics</CardTitle>
          <CardDescription>Credentials and MCP readiness for all supported integrations.</CardDescription>
        </CardHeader>
        <CardContent className={'space-y-4'}>
          {isLoading ? (
            <div className={'text-sm text-muted-foreground'}>Loading diagnostics...</div>
          ) : mcpDiagnostics.length === 0 ? (
            <div className={'rounded-md border border-dashed p-6 text-sm text-muted-foreground'}>
              No MCP diagnostics available.
            </div>
          ) : (
            <div className={'space-y-3'}>
              {mcpDiagnostics.map((entry) => {
                const provider = providers.find((item) => item.slug === entry.service) ?? null;
                const statusLabel = getDiagnosticsStatusLabel(entry.diagnostics?.status);
                const missingFields = entry.diagnostics?.missingFields || [];
                const actionLabel = provider?.authType === 'apikey'
                  ? 'Add API Key'
                  : provider?.configured
                    ? 'Connect'
                    : 'Set up OAuth';
                return (
                  <div key={entry.service} className={'rounded-lg border p-4'}>
                    <div className={'flex flex-wrap items-start justify-between gap-3'}>
                      <div>
                        <div className={'text-base font-semibold'}>{entry.name}</div>
                        <div className={'text-xs text-muted-foreground'}>{entry.service}</div>
                        <div className={'mt-2 flex flex-wrap items-center gap-2'}>
                          <Badge
                            variant={entry.diagnostics?.status === 'ready' ? 'success' : 'outline'}
                          >
                            {statusLabel}
                          </Badge>
                          <Badge variant={'outline'}>
                            Connection: {entry.diagnostics?.connectionStatus || 'unknown'}
                          </Badge>
                          <Badge variant={'outline'}>
                            MCP {entry.diagnostics?.mcpEnabled ? 'enabled' : 'disabled'}
                          </Badge>
                        </div>
                      </div>
                      <div className={'flex items-center gap-2'}>
                        <Button
                          type={'button'}
                          size={'sm'}
                          variant={'outline'}
                          onClick={() => {
                            if (provider) {
                              handleConnect(provider);
                            }
                          }}
                          disabled={!provider || isSubmitting}
                        >
                          {actionLabel}
                        </Button>
                        {provider?.authType === 'oauth2' && provider.configured ? (
                          <Button
                            type={'button'}
                            size={'sm'}
                            variant={'ghost'}
                            onClick={() => openOAuthSetup(provider)}
                            disabled={isSubmitting}
                          >
                            Update OAuth App
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {missingFields.length > 0 ? (
                      <div className={'mt-3 flex flex-wrap gap-2'}>
                        {missingFields.slice(0, 6).map((field) => (
                          <Badge key={field} variant={'outline'}>
                            {field}
                          </Badge>
                        ))}
                        {missingFields.length > 6 ? (
                          <span className={'text-xs text-muted-foreground'}>
                            +{missingFields.length - 6} more
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className={'mt-3 text-xs text-muted-foreground'}>
                        All required credentials present.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Services</CardTitle>
          <CardDescription>Powered by Bluebear.ai and enabled by your ExecGPT admin.</CardDescription>
        </CardHeader>
        <CardContent className={'space-y-4'}>
          {isLoading ? (
            <div className={'text-sm text-muted-foreground'}>Loading integrations...</div>
          ) : connected.length === 0 ? (
            <div className={'rounded-md border border-dashed p-6 text-sm text-muted-foreground'}>
              No services connected yet.
            </div>
          ) : (
            <div className={'grid gap-4 md:grid-cols-2'}>
              {connected.map((service) => (
                <div key={service.id} className={'rounded-lg border p-4'}>
                  <div className={'flex items-center justify-between'}>
                    <div>
                      <div className={'text-lg font-semibold'}>{service.name}</div>
                      <div className={'text-xs text-muted-foreground'}>
                        {service.service}
                      </div>
                    </div>
                    <div className={'flex items-center gap-2'}>
                      <Badge variant={service.connectionStatus === 'connected' ? 'success' : 'outline'}>
                        {service.connectionStatus}
                      </Badge>
                      {service.mcpEnabled ? (
                        <Badge variant={'outline'}>MCP enabled</Badge>
                      ) : null}
                    </div>
                  </div>
                    <div className={'mt-3 flex items-center justify-between text-xs text-muted-foreground'}>
                      <span>
                        Last Sync: {service.lastSyncAt ? new Date(service.lastSyncAt).toLocaleDateString() : '—'}
                      </span>
                      <div className={'flex items-center gap-2'}>
                        {(() => {
                          const provider = providers.find((entry) => entry.slug === service.service);
                          if (!provider?.mcpAvailable) {
                            return null;
                          }
                          const isEnabled = Boolean(service.mcpEnabled);
                          const isBusy = Boolean(mcpActionIds[service.service]);
                          return (
                            <Button
                              size={'sm'}
                              variant={'outline'}
                              onClick={() => handleToggleMcp(service.service, !isEnabled)}
                              disabled={isBusy || isSubmitting}
                            >
                              {isBusy ? 'Updating...' : isEnabled ? 'Disable MCP' : 'Enable MCP'}
                            </Button>
                          );
                        })()}
                        {(() => {
                          const provider = providers.find((entry) => entry.slug === service.service);
                          if (!provider || provider.authType !== 'oauth2' || !provider.configured) {
                            return null;
                          }
                          return (
                            <Button
                              size={'sm'}
                              variant={'ghost'}
                              onClick={() => openOAuthSetup(provider)}
                              disabled={isSubmitting}
                            >
                              Update OAuth App
                            </Button>
                          );
                        })()}
                        <Button
                          size={'sm'}
                          variant={'ghost'}
                          onClick={() => handleDisconnect(service.id)}
                          disabled={isSubmitting}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showApiKeyModal && selectedProvider ? (
        <div className={'fixed inset-0 z-50 flex items-center justify-center bg-black/50'}>
          <div className={'w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg'}>
            <div className={'text-lg font-semibold'}>Connect {selectedProvider.name}</div>
            <div className={'text-sm text-muted-foreground'}>
              Enter the API key for this service. It will be stored securely per tenant.
            </div>
            <div className={'mt-4 space-y-3'}>
              <Input
                type={'password'}
                placeholder={'API key'}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
              <div className={'flex justify-end gap-2'}>
                <Button
                  variant={'ghost'}
                  type={'button'}
                  onClick={() => setShowApiKeyModal(false)}
                >
                  Cancel
                </Button>
                <Button type={'button'} onClick={handleSubmitApiKey} disabled={isSubmitting}>
                  {isSubmitting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showOAuthSetupModal && selectedProvider ? (
        <div className={'fixed inset-0 z-50 flex items-center justify-center bg-black/50'}>
          <div className={'w-full max-w-xl rounded-xl border bg-background p-6 shadow-lg'}>
            <div className={'text-lg font-semibold'}>Set up {selectedProvider.name} OAuth</div>
            <div className={'text-sm text-muted-foreground'}>
              Add your OAuth app credentials so customers can connect {selectedProvider.name}. Updating replaces the
              active credentials and requires reconnecting.
            </div>
            {selectedProvider.slug === 'quickbooks' ? (
              <div className={'mt-4 rounded-lg border bg-muted/40 p-4 text-sm'}>
                <div className={'font-semibold'}>QuickBooks setup steps</div>
                <ol className={'mt-2 list-decimal space-y-1 pl-5 text-xs text-muted-foreground'}>
                  <li>Create or open your Intuit Developer app (Sandbox).</li>
                  <li>Set Redirect URI to: {`${apiBase}/api/v1/oauth/quickbooks/callback`}</li>
                  <li>Copy the Client ID + Client Secret into the fields below.</li>
                </ol>
              </div>
            ) : null}
            <div className={'mt-4 space-y-3'}>
              <Input
                placeholder={'Client ID'}
                value={oauthClientId}
                onChange={(event) => setOauthClientId(event.target.value)}
              />
              <Input
                type={'password'}
                placeholder={'Client Secret'}
                value={oauthClientSecret}
                onChange={(event) => setOauthClientSecret(event.target.value)}
              />
              <Input
                placeholder={'Scopes (comma separated)'}
                value={oauthScopes}
                onChange={(event) => setOauthScopes(event.target.value)}
              />
              <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
                <span>Environment:</span>
                <Button
                  type={'button'}
                  size={'sm'}
                  variant={oauthEnvironment === 'sandbox' ? 'default' : 'outline'}
                  onClick={() => setOauthEnvironment('sandbox')}
                >
                  Sandbox
                </Button>
                <Button
                  type={'button'}
                  size={'sm'}
                  variant={oauthEnvironment === 'production' ? 'default' : 'outline'}
                  onClick={() => setOauthEnvironment('production')}
                >
                  Production
                </Button>
              </div>
              <div className={'flex justify-end gap-2'}>
                <Button
                  variant={'ghost'}
                  type={'button'}
                  onClick={() => setShowOAuthSetupModal(false)}
                >
                  Cancel
                </Button>
                <Button type={'button'} onClick={handleSubmitOAuthApp} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save OAuth App'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
