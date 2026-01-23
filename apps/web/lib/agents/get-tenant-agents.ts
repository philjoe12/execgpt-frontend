import 'server-only';

import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME, DEFAULT_AUTH_API_BASE } from '~/lib/auth/constants';

type AgentSummary = {
  id: string;
  name: string;
  status?: string | null;
};

function getTenantApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_AUTH_API_BASE;
}

export async function getTenantAgentsForSidebar(
  tenantId: string | null,
): Promise<AgentSummary[]> {
  if (!tenantId) {
    return [];
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return [];
  }

  try {
    const response = await fetch(
      `${getTenantApiBase()}/api/v1/tenants/${tenantId}/agents?include_mcps=false`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      console.info('[SidebarAgents] API error', {
        status: response.status,
        tenantId,
      });
      return [];
    }

    const payload = (await response.json()) as { agents?: AgentSummary[] };
    console.info('[SidebarAgents] Loaded agents', {
      tenantId,
      count: Array.isArray(payload?.agents) ? payload.agents.length : 0,
    });
    return Array.isArray(payload?.agents) ? payload.agents : [];
  } catch {
    console.info('[SidebarAgents] API request failed', { tenantId });
    return [];
  }
}
