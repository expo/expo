import { NativeModule, registerWebModule, SharedObject } from 'expo';

import type { Session } from './Session';
import type {
  ExpoAppMetricsModuleType,
  LogAttributeValue,
  LogEventOptions,
  LogRecord,
  Metric,
  MetricAttributes,
  NetworkRequestObserverEvents,
  MetricInput,
  SessionType,
} from './types';

export * from './types';

// Validation limits and reserved keys mirror the native rules in `ios/LogEvents/`.
const RESERVED_EVENT_NAME_PREFIX = 'expo.';
const MAX_EVENT_NAME_LENGTH = 256;
const MAX_EVENT_BODY_LENGTH = 4096;
const MAX_DISPLAY_NAME_LENGTH = 128;
const MAX_ATTRIBUTE_COUNT = 128;
const DISPLAY_NAME_ATTRIBUTE_KEY = 'expo.log.display_name';
const RESERVED_ATTRIBUTE_PATTERNS = [/^expo\..+$/, /^session\.id$/, /^event\.name$/];

// ponytail: in-memory queue for the page's lifetime; stops accepting when full. Add
// IndexedDB persistence if logs must survive reloads like the native SQLite store.
const MAX_STORED_LOGS = 1000;

const storedLogs: LogRecord[] = [];
let globalAttributes: Record<string, LogAttributeValue> = {};

/**
 * Truncates `value` to `maxLength` characters (ellipsis included), warning when
 * truncation actually happens. Returns `value` unchanged when it already fits.
 */
function truncateToMaxLength(value: string, maxLength: number, warningMessage: string): string {
  if (value.length <= maxLength) {
    return value;
  }
  console.warn(warningMessage);
  return value.slice(0, maxLength - 1) + '…';
}

function validateEventName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    console.warn('[AppMetrics] logEvent dropped: event name must not be empty.');
    return null;
  }
  if (trimmed.startsWith(RESERVED_EVENT_NAME_PREFIX)) {
    console.warn(
      `[AppMetrics] logEvent dropped: event name \`${trimmed}\` uses the reserved \`expo.\` prefix.`
    );
    return null;
  }
  if (trimmed.length > MAX_EVENT_NAME_LENGTH) {
    console.warn(
      `[AppMetrics] logEvent dropped: event name is ${trimmed.length} characters long, exceeding the ${MAX_EVENT_NAME_LENGTH}-character limit.`
    );
    return null;
  }
  return trimmed;
}

function validateEventBody(body: string | null | undefined): string | null {
  if (body == null) {
    return null;
  }
  return truncateToMaxLength(
    body,
    MAX_EVENT_BODY_LENGTH,
    `[AppMetrics] logEvent truncated body from ${body.length} characters to the ${MAX_EVENT_BODY_LENGTH}-character limit.`
  );
}

function validateDisplayName(displayName: string | null | undefined): string | null {
  const trimmed = displayName?.trim();
  if (!trimmed) {
    return null;
  }
  return truncateToMaxLength(
    trimmed,
    MAX_DISPLAY_NAME_LENGTH,
    `[AppMetrics] logEvent truncated displayName from ${trimmed.length} characters to the ${MAX_DISPLAY_NAME_LENGTH}-character limit.`
  );
}

/**
 * Filters caller-provided attributes: drops keys that are empty after trimming,
 * keys reserved by the SDK (`expo.*`, `session.id`, `event.name`), and everything
 * past the per-record cap — keeping alphabetically-first keys so the choice of
 * survivors is deterministic, matching native.
 */
function sanitizeAttributes(
  attributes: Record<string, LogAttributeValue> | null | undefined
): Record<string, LogAttributeValue> | null {
  if (attributes == null) {
    return null;
  }
  let sanitized: Record<string, LogAttributeValue> = {};
  let emptyKeyDrops = 0;
  const reservedKeyDrops: string[] = [];

  for (const [key, value] of Object.entries(attributes)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      emptyKeyDrops++;
      continue;
    }
    if (RESERVED_ATTRIBUTE_PATTERNS.some((pattern) => pattern.test(trimmedKey))) {
      reservedKeyDrops.push(key);
      continue;
    }
    sanitized[trimmedKey] = value;
  }

  const keys = Object.keys(sanitized);
  if (keys.length > MAX_ATTRIBUTE_COUNT) {
    const kept = new Set(keys.sort().slice(0, MAX_ATTRIBUTE_COUNT));
    sanitized = Object.fromEntries(Object.entries(sanitized).filter(([key]) => kept.has(key)));
    console.warn(
      `[AppMetrics] logEvent dropped ${keys.length - MAX_ATTRIBUTE_COUNT} attribute(s) past the ${MAX_ATTRIBUTE_COUNT}-attribute per-record cap.`
    );
  }
  if (emptyKeyDrops > 0) {
    console.warn(
      `[AppMetrics] logEvent dropped ${emptyKeyDrops} attribute(s) with empty or whitespace-only keys.`
    );
  }
  if (reservedKeyDrops.length > 0) {
    const formattedKeys = reservedKeyDrops
      .sort()
      .map((key) => `\`${key}\``)
      .join(', ');
    console.warn(
      `[AppMetrics] logEvent dropped attributes that overlap SDK-set keys or use the reserved \`expo.\` namespace: ${formattedKeys}.`
    );
  }
  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function uuidv4(): string {
  // ponytail: Math.random fallback for insecure contexts / older jsdom; collision
  // odds are irrelevant for telemetry session ids.
  return (
    globalThis.crypto?.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    })
  );
}

class NetworkRequestObserverWeb extends SharedObject<NetworkRequestObserverEvents> {
  // Web has no native interceptor, so this never emits. Kept as a no-op so cross-platform code
  // can construct it without guarding on Platform.OS.
}

class WebSession extends globalThis.expo.SharedObject {
  readonly id = uuidv4();
  readonly startDate = new Date().toISOString();

  constructor(readonly type: SessionType = 'main') {
    super();
  }

  async isActive(): Promise<boolean> {
    return true;
  }
  async getEndDate(): Promise<string | null> {
    return null;
  }
  async getMetrics(): Promise<Metric[]> {
    return [];
  }
  async getLogs(): Promise<LogRecord[]> {
    return storedLogs.slice();
  }
  async addMetric(_metric: MetricInput): Promise<void> {}
}

class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
  NetworkRequestObserver =
    NetworkRequestObserverWeb as unknown as ExpoAppMetricsModuleType['NetworkRequestObserver'];
  Session = WebSession as unknown as typeof Session;

  private mainSession: WebSession | null = null;

  async markFirstRender() {}
  async markInteractive(attributes?: MetricAttributes) {}
  logEvent(name: string, options?: LogEventOptions) {
    const validatedName = validateEventName(name);
    if (!validatedName || storedLogs.length >= MAX_STORED_LOGS) {
      return;
    }
    // Globals merge at write time, per-record attributes winning — matching native.
    const attributes = { ...globalAttributes, ...sanitizeAttributes(options?.attributes) };
    const displayName = validateDisplayName(options?.displayName);
    if (displayName !== null) {
      attributes[DISPLAY_NAME_ATTRIBUTE_KEY] = displayName;
    }
    storedLogs.push({
      timestamp: new Date().toISOString(),
      name: validatedName,
      body: validateEventBody(options?.body),
      attributes: Object.keys(attributes).length > 0 ? attributes : null,
      severity: options?.severity ?? 'info',
    });
  }
  setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null) {
    globalAttributes = sanitizeAttributes(attributes) ?? {};
  }
  async clearStoredEntries() {
    storedLogs.length = 0;
  }
  async getInactiveSessions() {
    return [];
  }
  reportError() {}
  getMainSession(): Session {
    this.mainSession ??= new WebSession('main');
    return this.mainSession as unknown as Session;
  }
  async getForegroundSession() {
    return null;
  }
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
