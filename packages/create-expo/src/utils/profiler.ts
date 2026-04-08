import { env } from './env';

interface Span {
  label: string;
  startNs: bigint;
  endNs: bigint;
  parentIndex: number | null;
}

export interface ProfileReport {
  spans: {
    label: string;
    durationMs: number;
    parent: string | null;
  }[];
  totalMs: number;
}

let spans: Span[] = [];
let stack: number[] = [];

function isEnabled(): boolean {
  return !!env.CREATE_EXPO_PROFILE;
}

function reset() {
  spans = [];
  stack = [];
}

export async function profileAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!isEnabled()) return fn();

  const parentIndex = stack.length > 0 ? stack[stack.length - 1]! : null;
  const index = spans.length;
  const span: Span = { label, startNs: process.hrtime.bigint(), endNs: 0n, parentIndex };
  spans.push(span);
  stack.push(index);
  try {
    return await fn();
  } finally {
    span.endNs = process.hrtime.bigint();
    stack.pop();
  }
}

export function profileSync<T>(label: string, fn: () => T): T {
  if (!isEnabled()) return fn();

  const parentIndex = stack.length > 0 ? stack[stack.length - 1]! : null;
  const index = spans.length;
  const span: Span = { label, startNs: process.hrtime.bigint(), endNs: 0n, parentIndex };
  spans.push(span);
  stack.push(index);
  try {
    return fn();
  } finally {
    span.endNs = process.hrtime.bigint();
    stack.pop();
  }
}

function nsToDurationMs(startNs: bigint, endNs: bigint): number {
  return Number(endNs - startNs) / 1e6;
}

function getSpanDepth(index: number): number {
  let depth = 0;
  let current = spans[index];
  while (current?.parentIndex !== null && current?.parentIndex !== undefined) {
    depth++;
    current = spans[current.parentIndex];
  }
  return depth;
}

export function getReportData(): ProfileReport {
  let totalMs = 0;
  const rootSpans = spans.filter((s) => s.parentIndex === null);
  for (const s of rootSpans) {
    totalMs += nsToDurationMs(s.startNs, s.endNs);
  }

  return {
    spans: spans.map((s) => ({
      label: s.label,
      durationMs: Math.round(nsToDurationMs(s.startNs, s.endNs) * 100) / 100,
      parent: s.parentIndex !== null ? spans[s.parentIndex]!.label : null,
    })),
    totalMs: Math.round(totalMs * 100) / 100,
  };
}

function formatMs(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms.toFixed(2)}ms`;
}

export function printReport(): void {
  if (!isEnabled()) return;

  const report = getReportData();
  const mode = env.CREATE_EXPO_PROFILE;

  if (mode === 'json') {
    process.stderr.write(JSON.stringify(report) + '\n');
    return;
  }

  // Table output
  const labelCol = 44;
  const lines: string[] = [];
  lines.push('');
  lines.push('┌─ Profile Report ─────────────────────────────────────────────┐');

  for (let i = 0; i < report.spans.length; i++) {
    const span = report.spans[i]!;
    const depth = getSpanDepth(i);
    const indent = '  '.repeat(depth);
    const displayLabel = indent + span.label;
    const truncated =
      displayLabel.length > labelCol
        ? displayLabel.slice(0, labelCol - 1) + '…'
        : displayLabel.padEnd(labelCol);
    const pct = report.totalMs > 0 ? ((span.durationMs / report.totalMs) * 100).toFixed(1) : '0.0';
    lines.push(
      `│ ${truncated} ${formatMs(span.durationMs).padStart(10)} ${(pct + '%').padStart(7)} │`
    );
  }

  lines.push(`├───────────────────────────────────────────────────────────────┤`);
  lines.push(
    `│ ${'Total'.padEnd(labelCol)} ${formatMs(report.totalMs).padStart(10)} ${'100.0%'.padStart(7)} │`
  );
  lines.push(`└───────────────────────────────────────────────────────────────┘`);
  lines.push('');

  process.stderr.write(lines.join('\n') + '\n');
}

/** Reset internal state — only for testing. */
export function _resetForTesting(): void {
  reset();
}
