'use client';

import { useEffect, useState } from 'react';

import { Button } from '@kit/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import { getAuthToken } from '~/lib/auth/client';
type Customer = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at?: string;
};

export function CustomerListTable(props: {
  apiBase: string;
  emptyMessage?: string;
}) {
  const [apiKey, setApiKey] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSessionToken, setHasSessionToken] = useState(false);

  useEffect(() => {
    setHasSessionToken(Boolean(getAuthToken()));
  }, []);

  const handleFetch = async () => {
    setIsLoading(true);
    setError('');
    try {
      const sessionToken = getAuthToken();
      const response = await fetch(`${props.apiBase}/api/v1/tenants/customers`, {
        headers: {
          Authorization: `Bearer ${sessionToken || apiKey}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fetch customers.');
      }

      setCustomers(payload.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={'space-y-4 rounded-xl border bg-card p-6'}>
      <div className={'space-y-2'}>
        {hasSessionToken ? (
          <div className={'rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground'}>
            Using your signed-in ExecGPT session.
          </div>
        ) : (
          <>
            <label className={'text-muted-foreground text-xs uppercase tracking-wide'}>
              Reseller API Key
            </label>
            <input
              className={'w-full rounded-md border px-3 py-2 text-sm'}
              placeholder={'bb_execgpt_...'}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </>
        )}
      </div>

      <Button onClick={handleFetch} disabled={(!hasSessionToken && !apiKey.trim()) || isLoading}>
        {isLoading ? 'Loading...' : 'Load Customers'}
      </Button>

      {error ? (
        <div className={'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'}>
          {error}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length ? (
            customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.slug}</TableCell>
                <TableCell>{customer.status}</TableCell>
                <TableCell>{customer.created_at || '-'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className={'text-muted-foreground'}>
                {props.emptyMessage || 'No customers yet.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
