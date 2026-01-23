'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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

type AgentRecord = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  implementation: string;
  status: string;
  mcp_count?: number;
  user_count?: number;
  mcps?: Array<{ mcp_slug: string }>;
};

type AgentMcp = {
  mcp_slug: string;
  is_required?: boolean;
  auto_connect?: boolean;
};

const IMPLEMENTATION_OPTIONS = [
  { value: 'openclaude', label: 'OpenClaude (headless)' },
  { value: 'claudexterminal', label: 'Claude Terminal (PTY)' },
  { value: 'openai', label: 'OpenAI (Codex)' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'goose', label: 'Goose' },
  { value: 'aider', label: 'Aider' },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function AgentsPanel() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.execgpt.com';
  const router = useRouter();
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantMcps, setTenantMcps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [implementation, setImplementation] = useState('openclaude');
  const [selectedMcps, setSelectedMcps] = useState<Record<string, boolean>>({});
  const [activeAgent, setActiveAgent] = useState<AgentRecord | null>(null);
  const [agentMcps, setAgentMcps] = useState<AgentMcp[]>([]);
  const [mcpBusy, setMcpBusy] = useState<Record<string, boolean>>({});
  const [sessionByAgent, setSessionByAgent] = useState<Record<string, { sessionId: string; wsUrl: string }>>({});
  const token = useMemo(() => getAuthToken(), []);

  const fetchWithAuth = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {});
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(input, { ...init, headers });
    },
    [token]
  );

  const loadTenant = useCallback(async () => {
    const response = await fetchWithAuth(`${apiBase}/api/v1/tenants/me`);
    if (!response.ok) {
      throw new Error('Unable to load tenant info.');
    }
    const payload = await response.json();
    setTenantId(payload?.tenant_id || null);
    return payload?.tenant_id as string | null;
  }, [apiBase, fetchWithAuth]);

  const loadProviders = useCallback(async () => {
    const response = await fetchWithAuth(`${apiBase}/api/v1/integrations/providers`);
    if (!response.ok) {
      throw new Error('Unable to load integration providers.');
    }
    const payload = await response.json();
    return Array.isArray(payload?.providers) ? payload.providers : [];
  }, [apiBase, fetchWithAuth]);

  const loadAgents = useCallback(
    async (tenant: string) => {
      const response = await fetchWithAuth(
        `${apiBase}/api/v1/tenants/${tenant}/agents?include_mcps=true`
      );
      if (!response.ok) {
        throw new Error('Unable to load agents.');
      }
      const payload = await response.json();
      return Array.isArray(payload?.agents) ? payload.agents : [];
    },
    [apiBase, fetchWithAuth]
  );

  const loadTenantMcps = useCallback(
    async (tenant: string) => {
      const response = await fetchWithAuth(`${apiBase}/api/v1/tenants/${tenant}/mcps`);
      if (!response.ok) {
        throw new Error('Unable to load tenant MCPs.');
      }
      const payload = await response.json();
      return Array.isArray(payload?.enabled_mcps) ? payload.enabled_mcps : [];
    },
    [apiBase, fetchWithAuth]
  );

  const refresh = useCallback(async () => {
    if (!token) {
      setError('Please sign in to manage agents.');
      setIsLoading(false);
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const tenant = await loadTenant();
      if (!tenant) {
        throw new Error('Tenant information is missing.');
      }
      const [providersResult, agentsResult, tenantMcpsResult] = await Promise.all([
        loadProviders(),
        loadAgents(tenant),
        loadTenantMcps(tenant),
      ]);
      setProviders(providersResult);
      setAgents(agentsResult);
      setTenantMcps(tenantMcpsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load agents.');
    } finally {
      setIsLoading(false);
    }
  }, [token, loadTenant, loadProviders, loadAgents, loadTenantMcps]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!name) {
      return;
    }
    setSlug((current) => (current ? current : slugify(name)));
  }, [name]);

  const availableMcps = useMemo(() => {
    if (!tenantMcps.length) {
      return [];
    }
    return providers.filter(
      (provider) => provider.mcpAvailable && tenantMcps.includes(provider.slug)
    );
  }, [providers, tenantMcps]);

  const handleCreateAgent = async () => {
    if (!tenantId) {
      setError('Tenant information is missing.');
      return;
    }
    if (!name.trim() || !slug.trim()) {
      setError('Agent name and slug are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      setError('');
      const response = await fetchWithAuth(`${apiBase}/api/v1/tenants/${tenantId}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slugify(slug),
          description: description.trim() || null,
          implementation,
          agent_type: 'chat',
          access_mode: 'assigned',
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create agent.');
      }

      const agentId = payload?.agent?.id;
      const selected = Object.entries(selectedMcps)
        .filter(([, checked]) => checked)
        .map(([slugValue]) => slugValue);

      if (agentId && selected.length > 0) {
        await Promise.all(
          selected.map((mcpSlug) =>
            fetchWithAuth(
              `${apiBase}/api/v1/tenants/${tenantId}/agents/${agentId}/mcps/${mcpSlug}`,
              { method: 'POST' }
            )
          )
        );
      }

      await refresh();
      router.refresh();

      setName('');
      setSlug('');
      setDescription('');
      setImplementation('openclaude');
      setSelectedMcps({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAgent = async (agent: AgentRecord) => {
    if (!tenantId) {
      setError('Tenant information is missing.');
      return;
    }
    setActiveAgent(agent);
    try {
      const response = await fetchWithAuth(
        `${apiBase}/api/v1/tenants/${tenantId}/agents/${agent.id}/mcps`
      );
      if (!response.ok) {
        throw new Error('Unable to load agent MCPs.');
      }
      const payload = await response.json();
      setAgentMcps(Array.isArray(payload?.mcps) ? payload.mcps : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load agent MCPs.');
    }
  };

  const handleToggleAgentMcp = async (mcpSlug: string, enable: boolean) => {
    if (!tenantId || !activeAgent) {
      setError('Select an agent first.');
      return;
    }
    setMcpBusy((prev) => ({ ...prev, [mcpSlug]: true }));
    try {
      setError('');
      const response = await fetchWithAuth(
        `${apiBase}/api/v1/tenants/${tenantId}/agents/${activeAgent.id}/mcps/${mcpSlug}`,
        { method: enable ? 'POST' : 'DELETE' }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update agent MCP.');
      }
      await handleOpenAgent(activeAgent);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent MCP.');
    } finally {
      setMcpBusy((prev) => ({ ...prev, [mcpSlug]: false }));
    }
  };

  const startSession = async (agent: AgentRecord) => {
    if (!tenantId) {
      setError('Tenant information is missing.');
      return null;
    }
    setIsSubmitting(true);
    try {
      setError('');
      const response = await fetchWithAuth(
        `${apiBase}/api/v1/tenants/${tenantId}/agents/${agent.id}/sessions`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to start agent session.');
      }
      const sessionInfo = { sessionId: payload.session_id, wsUrl: payload.ws_url };
      setSessionByAgent((prev) => ({
        ...prev,
        [agent.id]: sessionInfo
      }));
      return sessionInfo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start agent session.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChat = async (agent: AgentRecord) => {
    const sessionInfo = sessionByAgent[agent.id] || (await startSession(agent));
    if (!sessionInfo) {
      return;
    }
    router.push(`/home/agents/${agent.id}/chat?sessionId=${encodeURIComponent(sessionInfo.sessionId)}`);
  };

  return (
    <div className={'space-y-8'}>
      {error ? (
        <Alert variant={'destructive'}>
          <AlertTitle>Agent error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Agent Setup</CardTitle>
          <CardDescription>
            Choose the runtime (Claude, OpenAI, Gemini) and attach MCP integrations. Bluebear.ai deploys agents on Kubernetes for every white-label tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className={'space-y-4'}>
          <div className={'grid gap-4 md:grid-cols-2'}>
            <div className={'space-y-2'}>
              <label className={'text-sm font-medium'}>Agent Name</label>
              <Input
                placeholder={'e.g., Support Concierge'}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className={'space-y-2'}>
              <label className={'text-sm font-medium'}>Agent Slug</label>
              <Input
                placeholder={'support-concierge'}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </div>
          </div>
          <div className={'grid gap-4 md:grid-cols-2'}>
            <div className={'space-y-2'}>
              <label className={'text-sm font-medium'}>Agent Type</label>
              <select
                className={'h-10 w-full rounded-md border bg-background px-3 text-sm'}
                value={implementation}
                onChange={(event) => setImplementation(event.target.value)}
              >
                {IMPLEMENTATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={'space-y-2'}>
              <label className={'text-sm font-medium'}>Description</label>
              <Input
                placeholder={'Describe how this agent helps end users.'}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <div className={'space-y-2'}>
            <div className={'text-sm font-medium'}>MCP Integrations</div>
            {tenantMcps.length === 0 ? (
              <div className={'text-xs text-muted-foreground'}>
                No MCPs are enabled for this tenant. Enable integrations in Settings first.
              </div>
            ) : availableMcps.length === 0 ? (
              <div className={'text-xs text-muted-foreground'}>
                No MCP-enabled integrations available yet.
              </div>
            ) : (
              <div className={'grid gap-2 md:grid-cols-2'}>
                {availableMcps.map((provider) => (
                  <label
                    key={provider.slug}
                    className={'flex items-center justify-between rounded-md border px-3 py-2 text-sm'}
                  >
                    <span>{provider.name}</span>
                    <input
                      type={'checkbox'}
                      checked={Boolean(selectedMcps[provider.slug])}
                      onChange={(event) =>
                        setSelectedMcps((prev) => ({
                          ...prev,
                          [provider.slug]: event.target.checked,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className={'flex justify-end'}>
            <Button type={'button'} onClick={handleCreateAgent} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Agents</CardTitle>
          <CardDescription>
            Agents are provisioned through Bluebear.ai Kubernetes and inherit your enabled MCPs.
          </CardDescription>
        </CardHeader>
        <CardContent className={'space-y-4'}>
          {isLoading ? (
            <div className={'text-sm text-muted-foreground'}>Loading agents...</div>
          ) : agents.length === 0 ? (
            <div className={'rounded-md border border-dashed p-6 text-sm text-muted-foreground'}>
              No agents configured yet.
            </div>
          ) : (
            <div className={'grid gap-4 md:grid-cols-2'}>
              {agents.map((agent) => (
                <div key={agent.id} className={'rounded-lg border p-4'}>
                  <div className={'flex items-center justify-between'}>
                    <div>
                      <div className={'text-lg font-semibold'}>{agent.name}</div>
                      <div className={'text-xs text-muted-foreground'}>{agent.slug}</div>
                    </div>
                    <Badge variant={agent.status === 'active' ? 'success' : 'outline'}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className={'mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground'}>
                    <span>Implementation: {agent.implementation}</span>
                    <span>MCPs: {agent.mcp_count ?? agent.mcps?.length ?? 0}</span>
                    <span>Users: {agent.user_count ?? 0}</span>
                  </div>
                  <div className={'mt-3 flex justify-end'}>
                    <div className={'flex items-center gap-2'}>
                      <Button
                        size={'sm'}
                        variant={'outline'}
                        onClick={() => handleOpenAgent(agent)}
                      >
                        Manage MCPs
                      </Button>
                      <Button
                        size={'sm'}
                        onClick={() => openChat(agent)}
                        disabled={isSubmitting}
                      >
                        Open Chat
                      </Button>
                    </div>
                  </div>
                  {sessionByAgent[agent.id] ? (
                    <div className={'mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground'}>
                      Session ID: {sessionByAgent[agent.id].sessionId}
                      <br />
                      WS: {sessionByAgent[agent.id].wsUrl}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {activeAgent ? (
        <div className={'fixed inset-0 z-50 flex items-center justify-center bg-black/50'}>
          <div className={'w-full max-w-2xl rounded-xl border bg-background p-6 shadow-lg'}>
            <div className={'flex items-center justify-between'}>
              <div>
                <div className={'text-lg font-semibold'}>Manage MCPs</div>
                <div className={'text-xs text-muted-foreground'}>
                  {activeAgent.name} · {activeAgent.slug}
                </div>
              </div>
              <Button variant={'ghost'} onClick={() => setActiveAgent(null)}>
                Close
              </Button>
            </div>
            <div className={'mt-4 space-y-3'}>
              {availableMcps.length === 0 ? (
                <div className={'text-sm text-muted-foreground'}>
                  No MCP-enabled integrations available.
                </div>
              ) : (
                availableMcps.map((provider) => {
                  const enabled = agentMcps.some((mcp) => mcp.mcp_slug === provider.slug);
                  const busy = Boolean(mcpBusy[provider.slug]);
                  return (
                    <div
                      key={provider.slug}
                      className={'flex items-center justify-between rounded-md border px-3 py-2'}
                    >
                      <div>
                        <div className={'text-sm font-medium'}>{provider.name}</div>
                        <div className={'text-xs text-muted-foreground'}>
                          {provider.slug}
                        </div>
                      </div>
                      <Button
                        size={'sm'}
                        variant={'outline'}
                        onClick={() => handleToggleAgentMcp(provider.slug, !enabled)}
                        disabled={busy}
                      >
                        {busy ? 'Updating...' : enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
