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

// Web never dispatches, so the store only shrinks on `clearStoredEntries`; keep it bounded.
const MAX_STORED_LOGS = 1000;

class NetworkRequestObserverWeb extends SharedObject<NetworkRequestObserverEvents> {
  // Web has no native interceptor, so this never emits. Kept as a no-op so cross-platform code
  // can construct it without guarding on Platform.OS.
}

class WebSession extends globalThis.expo.SharedObject {
  readonly id = 'web-session';
  readonly startDate = new Date().toISOString();
  readonly logs: LogRecord[] = [];

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
    return [...this.logs];
  }
  async addMetric(_metric: MetricInput): Promise<void> {}
}

class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
  NetworkRequestObserver =
    NetworkRequestObserverWeb as unknown as ExpoAppMetricsModuleType['NetworkRequestObserver'];
  Session = WebSession as unknown as typeof Session;

  private mainSession: WebSession | null = null;
  private globalAttributes: Record<string, LogAttributeValue> = {};

  async markFirstRender() {}
  async markInteractive(attributes?: MetricAttributes) {}
  logEvent(name: string, options?: LogEventOptions) {
    this.storeLog({
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
  setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null) {
    this.globalAttributes = { ...attributes };
  }
  setNetworkTracesConfig() {}
  async clearStoredEntries() {
    this.mainSession?.logs.splice(0);
  }
  async getInactiveSessions() {
    return [];
  }
  reportError(error: Parameters<ExpoAppMetricsModuleType['reportError']>[0]) {
    // Same `js.exception` layout as native, except absent optional fields are omitted rather than
    // stored as `null`, which `LogAttributeValue` does not allow.
    this.storeLog({
      name: 'js.exception',
      attributes: {
        'expo.error.source': error.source,
        'expo.error.is_fatal': error.isFatal,
        'exception.message': error.message,
        ...(error.type != null ? { 'exception.type': error.type } : {}),
        ...(error.stacktrace != null ? { 'exception.stacktrace': error.stacktrace } : {}),
        ...(error.componentStack != null
          ? { 'expo.error.component_stack': error.componentStack }
          : {}),
      },
      severity: error.isFatal ? 'fatal' : 'error',
    });
  }
  getMainSession(): Session {
    // `WebSession` mirrors the native shared object's surface without extending the declared class.
    return this.getWebMainSession() as unknown as Session;
  }
  async getForegroundSession() {
    return null;
  }

  private getWebMainSession(): WebSession {
    this.mainSession ??= new WebSession('main');
    return this.mainSession;
  }

  private storeLog(record: Omit<LogRecord, 'timestamp'>) {
    // During server rendering this singleton is shared by every request, and nothing reads the
    // logs there.
    if (typeof window === 'undefined') return;
    const attributes = { ...this.globalAttributes, ...record.attributes };
    const { logs } = this.getWebMainSession();
    logs.push({
      ...record,
      timestamp: new Date().toISOString(),
      attributes: Object.keys(attributes).length > 0 ? attributes : null,
    });
    if (logs.length > MAX_STORED_LOGS) {
      logs.shift();
    }
  }
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
