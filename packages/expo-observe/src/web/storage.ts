import type { LogAttributeValue, LogEventOptions, LogRecord } from 'expo-app-metrics';

import type { NormalizedReportedError } from '../reportCaughtError';

// Web never persists, so the store only shrinks when records are dispatched; keep it bounded.
const MAX_PENDING_LOGS = 1000;

// One session per page load, so `session.id` tells records of different visitors apart.
export const sessionId: string =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

let pending: LogRecord[] = [];
let globalAttributes: Record<string, LogAttributeValue> = {};

export function setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null): void {
  globalAttributes = { ...attributes };
}

export function storeLog(name: string, options?: LogEventOptions): void {
  // Unlike native, nothing validates the name or strips reserved `expo.*` attribute keys here.
  store({
    name,
    body: options?.body ?? null,
    attributes: {
      ...options?.attributes,
      // Native keeps the display name as a reserved attribute; store the same record shape here.
      ...(options?.displayName != null ? { 'expo.log.display_name': options.displayName } : {}),
    },
    severity: options?.severity ?? 'info',
  });
}

/**
 * Stores an error reported by user code as a `js.exception` record in the native layout, except
 * that absent optional fields are omitted rather than stored as `null`, which `LogAttributeValue`
 * does not allow.
 */
export function storeReportedError(error: NormalizedReportedError): void {
  store({
    name: 'js.exception',
    body: null,
    attributes: {
      'expo.error.source': 'reportedByUser',
      'expo.error.is_fatal': false,
      'exception.message': error.message,
      ...(error.type != null ? { 'exception.type': error.type } : {}),
      ...(error.stacktrace != null ? { 'exception.stacktrace': error.stacktrace } : {}),
    },
    severity: 'error',
  });
}

export function getPendingLogs(): LogRecord[] {
  return [...pending];
}

export function removeLogs(records: LogRecord[]): void {
  const removed = new Set(records);
  pending = pending.filter((record) => !removed.has(record));
}

function store(record: Omit<LogRecord, 'timestamp'>): void {
  // During server rendering this module state is shared by every request, and nothing reads the
  // records there.
  if (typeof window === 'undefined') {
    return;
  }
  const attributes = { ...globalAttributes, ...record.attributes };
  pending.push({
    ...record,
    timestamp: new Date().toISOString(),
    attributes: Object.keys(attributes).length > 0 ? attributes : null,
  });
  if (pending.length > MAX_PENDING_LOGS) {
    pending.shift();
  }
}
