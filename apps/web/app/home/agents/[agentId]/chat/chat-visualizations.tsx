'use client';

import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@kit/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

type TrendDirection = 'up' | 'down' | 'neutral';
type AlertVariant = 'default' | 'warning' | 'success' | 'destructive';

export type VisualizationComponent =
  | {
      type: 'kpi-card';
      title: string;
      value: string | number;
      subtitle?: string;
      change?: string;
      trend?: TrendDirection;
      variant?: AlertVariant;
    }
  | {
      type: 'metric-grid';
      title?: string;
      metrics: Array<{
        label: string;
        value: string | number;
        change?: string;
        trend?: TrendDirection;
      }>;
    }
  | {
      type: 'summary-text';
      text: string;
    }
  | {
      type: 'progress-indicator';
      title?: string;
      label?: string;
      value: number;
      max?: number;
      variant?: AlertVariant;
    }
  | {
      type: 'alert';
      title: string;
      description: string;
      variant?: AlertVariant;
    }
  | {
      type: 'data-table';
      title?: string;
      description?: string;
      columns: Array<{ key: string; label: string; badge?: boolean }>;
      rows: Array<Record<string, string | number | null>>;
    }
  | {
      type: 'line-chart' | 'bar-chart' | 'area-chart';
      title?: string;
      description?: string;
      data: Array<Record<string, string | number>>;
      xAxisKey: string;
      dataKeys: Array<{ key: string; label?: string; color?: string }>;
    }
  | {
      type: 'pie-chart';
      title?: string;
      description?: string;
      data: Array<Record<string, string | number>>;
      nameKey: string;
      valueKey: string;
    };

const DEFAULT_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const variantToBadge = (variant?: AlertVariant) => {
  if (variant === 'success') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (variant === 'warning') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (variant === 'destructive') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  return 'bg-muted/40 text-muted-foreground border-border/60';
};

const renderTrend = (trend?: TrendDirection, change?: string) => {
  if (!change) return null;
  const icon = trend === 'down' ? <ArrowDown className={'h-3 w-3'} /> : <ArrowUp className={'h-3 w-3'} />;
  const color = trend === 'down' ? 'text-rose-500' : 'text-emerald-500';
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      {icon}
      {change}
    </span>
  );
};

type ParsedVisualizationPayload = {
  text: string;
  summary?: string;
  components: VisualizationComponent[];
};

const normalizeDataKeys = (dataKeys: unknown): Array<{ key: string; label?: string; color?: string }> => {
  if (!Array.isArray(dataKeys)) return [];
  return dataKeys
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return { key: entry };
      if (typeof entry === 'object' && 'key' in entry) {
        const typed = entry as { key: string; label?: string; color?: string };
        return { key: typed.key, label: typed.label, color: typed.color };
      }
      return null;
    })
    .filter((entry): entry is { key: string; label?: string; color?: string } => Boolean(entry?.key));
};

const normalizeTableColumns = (
  columns: unknown,
  rows: Array<Record<string, string | number | null>>
): Array<{ key: string; label: string; badge?: boolean }> => {
  if (Array.isArray(columns) && columns.length) {
    return columns.map((column: any) => {
      if (typeof column === 'string') {
        return { key: column, label: column };
      }
      return {
        key: column.key,
        label: column.label || column.key,
        badge: column.badge
      };
    });
  }
  if (rows.length) {
    return Object.keys(rows[0]).map((key) => ({ key, label: key }));
  }
  return [];
};

const normalizeComponent = (raw: any): VisualizationComponent | null => {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type as VisualizationComponent['type'] | undefined;
  if (!type) return null;

  if (type === 'kpi-card') {
    const trend = raw.trend?.direction as TrendDirection | undefined;
    const change = raw.change ?? (raw.trend?.value != null ? String(raw.trend.value) : undefined);
    return {
      type,
      title: raw.title || raw.label || 'Metric',
      value: raw.value ?? raw.amount ?? '—',
      subtitle: raw.subtitle || raw.description,
      change,
      trend,
      variant: raw.variant
    };
  }

  if (type === 'metric-grid') {
    return {
      type,
      title: raw.title,
      metrics: Array.isArray(raw.metrics) ? raw.metrics : []
    };
  }

  if (type === 'summary-text') {
    return {
      type,
      text: raw.text || raw.content || raw.summary || ''
    };
  }

  if (type === 'progress-indicator') {
    const value = typeof raw.value === 'number' ? raw.value : 0;
    const max = typeof raw.max === 'number' && raw.max > 0 ? raw.max : undefined;
    const percent = max ? Math.round((value / max) * 100) : value;
    return {
      type,
      title: raw.title,
      label: raw.label,
      value: Number.isFinite(percent) ? percent : 0,
      max,
      variant: raw.variant
    };
  }

  if (type === 'alert') {
    return {
      type,
      title: raw.title || raw.label || 'Alert',
      description: raw.description || raw.message || '',
      variant: raw.variant
    };
  }

  if (type === 'data-table') {
    const rows = Array.isArray(raw.rows) ? raw.rows : Array.isArray(raw.data) ? raw.data : [];
    return {
      type,
      title: raw.title,
      description: raw.description,
      rows,
      columns: normalizeTableColumns(raw.columns, rows)
    };
  }

  if (type === 'line-chart' || type === 'bar-chart' || type === 'area-chart') {
    return {
      type,
      title: raw.title,
      description: raw.description,
      data: Array.isArray(raw.data) ? raw.data : [],
      xAxisKey: raw.xAxisKey || raw.xAxis || 'name',
      dataKeys: normalizeDataKeys(raw.dataKeys)
    };
  }

  if (type === 'pie-chart') {
    return {
      type,
      title: raw.title,
      description: raw.description,
      data: Array.isArray(raw.data) ? raw.data : [],
      nameKey: raw.nameKey || raw.xAxisKey || raw.labelKey || 'name',
      valueKey: raw.valueKey || raw.dataKey || raw.valueField || 'value'
    };
  }

  return null;
};

const normalizePayload = (parsed: any): { summary?: string; components: VisualizationComponent[] } => {
  const summary = typeof parsed?.summary === 'string' ? parsed.summary : undefined;
  const rawComponents = Array.isArray(parsed?.components)
    ? parsed.components
    : parsed?.type
      ? [parsed]
      : Array.isArray(parsed?.component)
        ? parsed.component
        : parsed?.component
          ? [parsed.component]
          : [];
  const components = rawComponents.map(normalizeComponent).filter(Boolean) as VisualizationComponent[];
  return { summary, components };
};

export function parseVisualizationPayload(content: string): ParsedVisualizationPayload {
  const blocks = Array.from(content.matchAll(/```(?:json|viz)\s*([\s\S]*?)```/gi));
  if (blocks.length === 0) {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const normalized = normalizePayload(parsed);
        if (normalized.components.length) {
          return { text: '', summary: normalized.summary, components: normalized.components };
        }
      } catch {
        // fall through
      }
    }
    return { text: content, components: [] };
  }

  const components: VisualizationComponent[] = [];
  let cleaned = content;
  let summary: string | undefined;

  blocks.forEach((match) => {
    const raw = match[0];
    const jsonText = match[1];
    try {
      const parsed = JSON.parse(jsonText);
      const normalized = normalizePayload(parsed);
      if (normalized.summary) {
        summary = normalized.summary;
      }
      normalized.components.forEach((component) => components.push(component));
    } catch {
      // ignore parse failures
    }
    cleaned = cleaned.replace(raw, '').trim();
  });

  return { text: cleaned, summary, components };
}

export function ChatVisualizations({
  components,
  summary
}: {
  components: VisualizationComponent[];
  summary?: string;
}) {
  if (!components.length && !summary) return null;

  return (
    <div className={'mt-3 grid gap-3'}>
      {summary ? (
        <Card>
          <CardContent className={'text-xs text-muted-foreground'}>{summary}</CardContent>
        </Card>
      ) : null}
      {components.map((component, index) => (
        <VisualizationItem key={`${component.type}-${index}`} component={component} />
      ))}
    </div>
  );
}

function VisualizationItem({ component }: { component: VisualizationComponent }) {
  switch (component.type) {
    case 'kpi-card':
      return (
        <Card>
          <CardHeader className={'space-y-2'}>
            <CardTitle className={'text-sm'}>{component.title}</CardTitle>
            {component.subtitle ? (
              <CardDescription>{component.subtitle}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className={'space-y-2'}>
            <div className={'text-2xl font-semibold'}>{component.value}</div>
            <div className={'flex items-center gap-2'}>
              {renderTrend(component.trend, component.change)}
              {component.variant ? (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${variantToBadge(component.variant)}`}>
                  {component.variant}
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      );
    case 'metric-grid':
      return (
        <Card>
          {component.title ? (
            <CardHeader>
              <CardTitle className={'text-sm'}>{component.title}</CardTitle>
            </CardHeader>
          ) : null}
          <CardContent className={'grid gap-3 sm:grid-cols-2'}>
            {component.metrics.map((metric, idx) => (
              <div key={`${metric.label}-${idx}`} className={'rounded-lg border px-3 py-2'}>
                <div className={'text-xs text-muted-foreground'}>{metric.label}</div>
                <div className={'text-lg font-semibold'}>{metric.value}</div>
                {renderTrend(metric.trend, metric.change)}
              </div>
            ))}
          </CardContent>
        </Card>
      );
    case 'summary-text':
      return (
        <Card>
          <CardContent className={'text-sm leading-relaxed text-muted-foreground'}>
            {component.text}
          </CardContent>
        </Card>
      );
    case 'progress-indicator':
      return (
        <Card>
          {(component.title || component.label) ? (
            <CardHeader className={'space-y-1'}>
              {component.title ? <CardTitle className={'text-sm'}>{component.title}</CardTitle> : null}
              {component.label ? <CardDescription>{component.label}</CardDescription> : null}
            </CardHeader>
          ) : null}
          <CardContent className={'space-y-2'}>
            <ProgressBar value={component.value} />
            <div className={'text-xs text-muted-foreground'}>
              {component.max ? `${component.value}% · ${component.label || ''}`.trim() : `${component.value}%`}
            </div>
          </CardContent>
        </Card>
      );
    case 'alert':
      return (
        <Alert variant={component.variant === 'destructive' ? 'destructive' : 'default'}>
          <AlertTitle>{component.title}</AlertTitle>
          <AlertDescription>{component.description}</AlertDescription>
        </Alert>
      );
    case 'data-table':
      return (
        <Card>
          {component.title ? (
            <CardHeader>
              <CardTitle className={'text-sm'}>{component.title}</CardTitle>
              {component.description ? <CardDescription>{component.description}</CardDescription> : null}
            </CardHeader>
          ) : null}
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {component.columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {component.rows.map((row, idx) => (
                  <TableRow key={idx}>
                    {component.columns.map((column) => {
                      const value = row[column.key];
                      return (
                        <TableCell key={column.key}>
                          {column.badge ? (
                            <Badge variant={'outline'}>{String(value ?? '')}</Badge>
                          ) : (
                            String(value ?? '')
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    case 'line-chart':
    case 'bar-chart':
    case 'area-chart':
      return <SeriesChart component={component} />;
    case 'pie-chart':
      return <PieChartCard component={component} />;
    default:
      return null;
  }
}

function SeriesChart({
  component,
}: {
  component: Extract<VisualizationComponent, { type: 'line-chart' | 'bar-chart' | 'area-chart' }>;
}) {
  const config = component.dataKeys.reduce<ChartConfig>((acc, entry, index) => {
    acc[entry.key] = {
      label: entry.label ?? entry.key,
      color: entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    };
    return acc;
  }, {});

  return (
    <Card>
      {component.title ? (
        <CardHeader>
          <CardTitle className={'text-sm'}>{component.title}</CardTitle>
          {component.description ? <CardDescription>{component.description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent>
        <ChartContainer config={config} className={'h-[220px]'}>
          {component.type === 'bar-chart' ? (
            <BarChart data={component.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={component.xAxisKey} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {component.dataKeys.map((entry, index) => (
                <Bar key={entry.key} dataKey={entry.key} fill={`var(--color-${entry.key})`} radius={4} />
              ))}
            </BarChart>
          ) : component.type === 'area-chart' ? (
            <AreaChart data={component.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={component.xAxisKey} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {component.dataKeys.map((entry) => (
                <Area
                  key={entry.key}
                  type={'monotone'}
                  dataKey={entry.key}
                  stroke={`var(--color-${entry.key})`}
                  fill={`var(--color-${entry.key})`}
                  fillOpacity={0.2}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={component.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={component.xAxisKey} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {component.dataKeys.map((entry) => (
                <Line
                  key={entry.key}
                  type={'monotone'}
                  dataKey={entry.key}
                  stroke={`var(--color-${entry.key})`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function PieChartCard({
  component,
}: {
  component: Extract<VisualizationComponent, { type: 'pie-chart' }>;
}) {
  const config: ChartConfig = {
    value: {
      label: component.valueKey,
      color: DEFAULT_COLORS[0],
    },
  };

  return (
    <Card>
      {component.title ? (
        <CardHeader>
          <CardTitle className={'text-sm'}>{component.title}</CardTitle>
          {component.description ? <CardDescription>{component.description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent>
        <ChartContainer config={config} className={'h-[220px]'}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={component.data}
              dataKey={component.valueKey}
              nameKey={component.nameKey}
              innerRadius={45}
              outerRadius={90}
              paddingAngle={4}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className={'h-2 w-full overflow-hidden rounded-full bg-muted/40'}>
      <div
        className={'h-full rounded-full bg-primary/70 transition-all'}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
