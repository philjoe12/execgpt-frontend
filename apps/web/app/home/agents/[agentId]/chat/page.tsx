'use client';

import type { InputHTMLAttributes } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';

import { getAuthToken } from '~/lib/auth/client';

type AgentRecord = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  implementation: string;
  status: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

type SessionRecord = {
  session_id: string;
  status: string;
  started_at?: string | null;
  ended_at?: string | null;
  last_activity_at?: string | null;
};

type UploadItem = {
  file: File;
  path: string;
  size: number;
};

type ChatSettings = {
  historyLimit: number;
  uploadMaxFiles: number;
  uploadMaxTotalBytes: number;
  uploadBaseDir: string;
};

export default function AgentChatPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.execgpt.com';
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = Array.isArray(params?.agentId) ? params.agentId[0] : params?.agentId;
  const initialSessionId = searchParams?.get('sessionId');

  const token = useMemo(() => getAuthToken(), []);

  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSocket, setChatSocket] = useState<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isAwaiting, setIsAwaiting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [pendingUploads, setPendingUploads] = useState<UploadItem[]>([]);
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    historyLimit: 50,
    uploadMaxFiles: 50,
    uploadMaxTotalBytes: 10 * 1024 * 1024,
    uploadBaseDir: '/workspace/uploads'
  });
  const uploadFilesRef = useRef<HTMLInputElement>(null);
  const uploadFolderRef = useRef<HTMLInputElement>(null);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateLastAssistant = useCallback((content: string) => {
    setMessages((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const last = prev[prev.length - 1];
      if (last.role !== 'assistant') {
        return prev;
      }
      return [
        ...prev.slice(0, -1),
        { ...last, content: `${last.content}${content}` }
      ];
    });
  }, []);

  const stripAnsi = useCallback((text: string) => {
    return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
  }, []);

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

  const parseSettingValue = useCallback((value: unknown) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }, []);

  const buildWsUrl = useCallback((sessionIdValue: string, fallbackUrl?: string | null) => {
    let apiOrigin = window.location.origin;
    try {
      apiOrigin = new URL(apiBase).origin;
    } catch {
      apiOrigin = window.location.origin;
    }
    const wsProtocol = apiOrigin.startsWith('https') ? 'wss' : 'ws';
    const base = apiOrigin.replace(/^https?/, wsProtocol);
    const target = fallbackUrl || `/ws/agent-session/${sessionIdValue}`;
    const url = new URL(target, base);
    if (token) {
      url.searchParams.set('token', token);
    }
    return url.toString();
  }, [apiBase, token]);

  useEffect(() => {
    if (!token) {
      setError('Please sign in to start an agent session.');
      setIsLoading(false);
      return;
    }

    if (!agentId) {
      setError('Agent identifier is missing.');
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setError('');
        setIsLoading(true);
        const tenantResponse = await fetchWithAuth(`${apiBase}/api/v1/tenants/me`);
        if (!tenantResponse.ok) {
          throw new Error('Unable to load tenant info.');
        }
        const tenantPayload = await tenantResponse.json();
        const resolvedTenantId = tenantPayload?.tenant_id as string | undefined;
        if (!resolvedTenantId) {
          throw new Error('Tenant information is missing.');
        }
        setTenantId(resolvedTenantId);

        const agentResponse = await fetchWithAuth(
          `${apiBase}/api/v1/tenants/${resolvedTenantId}/agents/${agentId}`
        );
        if (!agentResponse.ok) {
          throw new Error('Unable to load agent.');
        }
        const agentPayload = await agentResponse.json();
        setAgent(agentPayload as AgentRecord);

        if (initialSessionId) {
          setSessionId(initialSessionId);
          setWsUrl(buildWsUrl(initialSessionId, null));
          return;
        }

        const sessionResponse = await fetchWithAuth(
          `${apiBase}/api/v1/tenants/${resolvedTenantId}/agents/${agentId}/sessions`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }
        );
        const sessionPayload = await sessionResponse.json();
        if (!sessionResponse.ok) {
          throw new Error(sessionPayload?.error || 'Failed to start agent session.');
        }
        const newSessionId = sessionPayload?.session_id as string | undefined;
        if (!newSessionId) {
          throw new Error('Session ID missing from agent start.');
        }
        setSessionId(newSessionId);
        setWsUrl(buildWsUrl(newSessionId, sessionPayload?.ws_url));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to start agent session.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [agentId, apiBase, buildWsUrl, fetchWithAuth, initialSessionId, token]);

  const fetchChatSettings = useCallback(async () => {
    if (!tenantId) {
      return;
    }
    try {
      const response = await fetchWithAuth(`${apiBase}/api/v1/tenants/${tenantId}/settings/chat`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to load chat settings.');
      }
      const settings = payload?.settings || {};
      const historyLimit = parseInt(parseSettingValue(settings.history_limit?.value ?? settings.history_limit) as string, 10);
      const uploadMaxFiles = parseInt(parseSettingValue(settings.upload_max_files?.value ?? settings.upload_max_files) as string, 10);
      const uploadMaxTotalBytes = parseInt(
        parseSettingValue(settings.upload_max_total_bytes?.value ?? settings.upload_max_total_bytes) as string,
        10
      );
      const uploadBaseDir = parseSettingValue(settings.upload_base_dir?.value ?? settings.upload_base_dir) as string;

      setChatSettings((prev) => ({
        historyLimit: Number.isFinite(historyLimit) ? historyLimit : prev.historyLimit,
        uploadMaxFiles: Number.isFinite(uploadMaxFiles) ? uploadMaxFiles : prev.uploadMaxFiles,
        uploadMaxTotalBytes: Number.isFinite(uploadMaxTotalBytes) ? uploadMaxTotalBytes : prev.uploadMaxTotalBytes,
        uploadBaseDir: uploadBaseDir || prev.uploadBaseDir
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load chat settings.');
    }
  }, [apiBase, fetchWithAuth, parseSettingValue, tenantId]);

  useEffect(() => {
    void fetchChatSettings();
  }, [fetchChatSettings]);

  const fetchSessionHistory = useCallback(async () => {
    if (!tenantId || !agentId) {
      return;
    }
    setIsHistoryLoading(true);
    try {
      const response = await fetchWithAuth(
        `${apiBase}/api/v1/tenants/${tenantId}/agents/${agentId}/sessions?status=all&limit=${chatSettings.historyLimit}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to load session history.');
      }
      const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
      setSessionHistory(sessions as SessionRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load session history.');
    } finally {
      setIsHistoryLoading(false);
    }
  }, [agentId, apiBase, chatSettings.historyLimit, fetchWithAuth, tenantId]);

  useEffect(() => {
    void fetchSessionHistory();
  }, [fetchSessionHistory, sessionId]);

  useEffect(() => {
    if (!wsUrl) {
      return;
    }

    console.info('[AgentChat] Connecting WebSocket', { wsUrl });
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.info('[AgentChat] WebSocket connected', { wsUrl });
    };
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        if (payload.type === 'output' && payload.data) {
          const decoded = stripAnsi(atob(payload.data));
          setIsAwaiting(false);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant' && Date.now() - last.timestamp < 2000) {
              return [
                ...prev.slice(0, -1),
                { ...last, content: `${last.content}${decoded}` }
              ];
            }
            return [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: decoded,
                timestamp: Date.now()
              }
            ];
          });
          return;
        }
        if (payload.type === 'warning') {
          const warningMessage = payload.message || 'Integration warning.';
          const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
          const detail = warnings
            .map((warn: { slug?: string; missing?: string[] }) =>
              warn.slug
                ? `• ${warn.slug}: missing ${warn.missing?.join(', ') || 'credentials'}`
                : '• Integration is not configured'
            )
            .join('\n');
          appendMessage({
            id: `warning-${Date.now()}`,
            role: 'system',
            content: detail ? `${warningMessage}\n${detail}` : warningMessage,
            timestamp: Date.now()
          });
          return;
        }
        if (payload.type === 'error') {
          appendMessage({
            id: `error-${Date.now()}`,
            role: 'system',
            content: payload.error || 'Agent error',
            timestamp: Date.now()
          });
          setIsAwaiting(false);
          return;
        }
        if (payload.type === 'session_created' || payload.type === 'ready' || payload.type === 'heartbeat') {
          return;
        }
      } catch {
        // Ignore parse failures and append raw output.
      }
      appendMessage({
        id: `system-${Date.now()}`,
        role: 'system',
        content: stripAnsi(event.data),
        timestamp: Date.now()
      });
    };
    ws.onclose = () => {
      console.warn('[AgentChat] WebSocket closed', { wsUrl });
      setChatSocket(null);
    };
    ws.onerror = (event) => {
      console.error('[AgentChat] WebSocket error', { wsUrl, event });
      setChatSocket(null);
    };
    setChatSocket(ws);

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  const isSessionReady = Boolean(sessionId && chatSocket && chatSocket.readyState === WebSocket.OPEN);

  const sendChatInput = () => {
    if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
      setError('Chat connection is not ready.');
      return;
    }
    if (!chatInput.trim()) {
      return;
    }
    appendMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: Date.now()
    });
    chatSocket.send(JSON.stringify({ type: 'input', data: `${chatInput}\n`, encoding: 'utf-8' }));
    setIsAwaiting(true);
    setChatInput('');
  };

  const handleSessionSelect = (selectedSessionId: string) => {
    if (!selectedSessionId || selectedSessionId === sessionId) {
      return;
    }
    if (chatSocket) {
      chatSocket.close();
    }
    setMessages([]);
    setSessionId(selectedSessionId);
    setWsUrl(buildWsUrl(selectedSessionId, null));
  };

  const startNewSession = async () => {
    if (!tenantId || !agentId) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(
        `${apiBase}/api/v1/tenants/${tenantId}/agents/${agentId}/sessions`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to start new session.');
      }
      const newSessionId = payload?.session_id as string | undefined;
      if (!newSessionId) {
        throw new Error('Session ID missing from agent start.');
      }
      if (chatSocket) {
        chatSocket.close();
      }
      setMessages([]);
      setSessionId(newSessionId);
      setWsUrl(buildWsUrl(newSessionId, payload?.ws_url));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start new session.');
    } finally {
      setIsLoading(false);
    }
  };

  const addUploads = (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }
    const files = Array.from(fileList);
    const next = files.slice(0, chatSettings.uploadMaxFiles).map((file) => {
      const withPath = file as File & { webkitRelativePath?: string };
      return {
        file,
        path: withPath.webkitRelativePath || file.name,
        size: file.size
      };
    });
    const totalBytes = next.reduce((sum, item) => sum + item.size, 0);
    if (totalBytes > chatSettings.uploadMaxTotalBytes) {
      setError(`Total upload size exceeds ${Math.round(chatSettings.uploadMaxTotalBytes / 1024 / 1024)}MB.`);
      return;
    }
    setPendingUploads(next);
  };

  const fileToBase64 = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  };

  const uploadPendingFiles = async () => {
    if (!tenantId || !agentId || !sessionId) {
      setError('Session is not ready for uploads.');
      return;
    }
    if (pendingUploads.length === 0) {
      return;
    }
    setIsUploading(true);
    try {
      const filesPayload = await Promise.all(
        pendingUploads.map(async (item) => ({
          path: item.path,
          contentBase64: await fileToBase64(item.file)
        }))
      );
      const response = await fetchWithAuth(
        `${apiBase}/api/v1/tenants/${tenantId}/agents/${agentId}/sessions/${sessionId}/files`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: filesPayload })
        }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to upload files.');
      }
      appendMessage({
        id: `upload-${Date.now()}`,
        role: 'system',
        content: `Uploaded ${pendingUploads.length} file(s) to ${payload?.base_dir || chatSettings.uploadBaseDir}.`,
        timestamp: Date.now()
      });
      setPendingUploads([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={'space-y-6'}>
      {error ? (
        <Alert variant={'destructive'}>
          <AlertTitle>Agent chat error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className={'flex flex-wrap items-center justify-between gap-2'}>
        <div className={'flex items-center gap-2'}>
          <Button variant={'outline'} size={'sm'} onClick={() => router.push('/home/agents')}>
            Agents
          </Button>
          <Button size={'sm'} disabled>
            Chat
          </Button>
        </div>
        {agent ? (
          <div className={'text-xs text-muted-foreground'}>
            Active agent: {agent.name}
          </div>
        ) : null}
      </div>

      <div className={'grid gap-6 lg:grid-cols-[280px,1fr]'}>
        <Card className={'h-fit'}>
          <CardHeader>
            <CardTitle className={'text-base'}>Session History</CardTitle>
            <CardDescription>Jump between active and recent sessions.</CardDescription>
          </CardHeader>
          <CardContent className={'space-y-4'}>
            <Button
              variant={'outline'}
              size={'sm'}
              className={'w-full'}
              onClick={startNewSession}
              disabled={isLoading}
            >
              New Session
            </Button>
            <div className={'space-y-2'}>
              {isHistoryLoading ? (
                <div className={'text-xs text-muted-foreground'}>Loading sessions...</div>
              ) : sessionHistory.length === 0 ? (
                <div className={'text-xs text-muted-foreground'}>No sessions yet.</div>
              ) : (
                sessionHistory.map((session) => {
                  const isActive = session.status === 'active';
                  const timestamp = session.last_activity_at || session.started_at || session.ended_at;
                  return (
                    <button
                      key={session.session_id}
                      onClick={() => isActive && handleSessionSelect(session.session_id)}
                      disabled={!isActive}
                      className={[
                        'w-full rounded-lg border px-3 py-2 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-60',
                        session.session_id === sessionId
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/60 hover:border-primary/30 hover:bg-muted/40'
                      ].join(' ')}
                    >
                      <div className={'flex items-center justify-between'}>
                        <span className={'font-medium'}>{session.session_id.slice(0, 10)}</span>
                        <span className={isActive ? 'text-emerald-500' : 'text-muted-foreground'}>
                          {isActive ? 'Active' : 'Ended'}
                        </span>
                      </div>
                      <div className={'mt-1 text-[10px] text-muted-foreground'}>
                        {timestamp ? new Date(timestamp).toLocaleString() : 'No activity'}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={'overflow-hidden'}>
          <CardHeader className={'border-b'}>
            <CardTitle>Agent Chat</CardTitle>
            <CardDescription>
              {agent ? `${agent.name} · ${agent.slug}` : 'Preparing session...'}
            </CardDescription>
          </CardHeader>
          <CardContent className={'space-y-4 pt-4'}>
            <div className={'rounded-2xl border bg-gradient-to-br from-muted/30 via-background to-muted/20'}>
              <div className={'max-h-[560px] overflow-auto space-y-3 p-5'}>
                {isLoading ? (
                  <div className={'text-xs text-muted-foreground'}>Starting session...</div>
                ) : messages.length === 0 ? (
                  <div className={'text-xs text-muted-foreground'}>Start the conversation.</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={[
                          'max-w-[82%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.role === 'assistant'
                              ? 'bg-background border border-border/70'
                              : 'bg-muted text-muted-foreground border border-border/60'
                        ].join(' ')}
                      >
                        <div className={'whitespace-pre-wrap leading-relaxed'}>
                          {message.content}
                        </div>
                        <div className={'mt-1 text-[10px] opacity-60'}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isAwaiting ? (
                  <div className={'flex justify-start'}>
                    <div className={'rounded-2xl border bg-background px-4 py-2 text-xs text-muted-foreground'}>
                      Agent is thinking…
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={'space-y-3'}>
              <div className={'flex flex-wrap gap-2'}>
                <input
                  ref={uploadFilesRef}
                  type="file"
                  multiple
                  className={'hidden'}
                  onChange={(event) => {
                    addUploads(event.target.files);
                    if (uploadFilesRef.current) {
                      uploadFilesRef.current.value = '';
                    }
                  }}
                />
                <input
                  ref={uploadFolderRef}
                  type="file"
                  multiple
                  className={'hidden'}
                  onChange={(event) => {
                    addUploads(event.target.files);
                    if (uploadFolderRef.current) {
                      uploadFolderRef.current.value = '';
                    }
                  }}
                  {...({ webkitdirectory: 'true' } as InputHTMLAttributes<HTMLInputElement>)}
                />
                <Button
                  type={'button'}
                  variant={'outline'}
                  size={'sm'}
                  onClick={() => uploadFilesRef.current?.click()}
                  disabled={!isSessionReady}
                >
                  Upload Files
                </Button>
                <Button
                  type={'button'}
                  variant={'outline'}
                  size={'sm'}
                  onClick={() => uploadFolderRef.current?.click()}
                  disabled={!isSessionReady}
                >
                  Upload Folder
                </Button>
                <Button
                  type={'button'}
                  variant={'outline'}
                  size={'sm'}
                  onClick={uploadPendingFiles}
                  disabled={!isSessionReady || isUploading || pendingUploads.length === 0}
                >
                  {isUploading ? 'Uploading…' : `Send ${pendingUploads.length || ''}`.trim()}
                </Button>
              </div>
              {pendingUploads.length > 0 ? (
                <div className={'rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground'}>
                  {pendingUploads.length} file(s) ready · {Math.round(
                    pendingUploads.reduce((sum, item) => sum + item.size, 0) / 1024
                  )} KB · Max {chatSettings.uploadMaxFiles} files / {Math.round(
                    chatSettings.uploadMaxTotalBytes / 1024 / 1024
                  )}MB
                </div>
              ) : null}
              <div className={'flex gap-2'}>
                <Input
                  placeholder={'Type a message...'}
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      sendChatInput();
                    }
                  }}
                />
                <Button type={'button'} onClick={sendChatInput} disabled={!sessionId || isAwaiting}>
                  Send
                </Button>
              </div>
              {sessionId ? (
                <div className={'text-xs text-muted-foreground'}>
                  Session: {sessionId}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
