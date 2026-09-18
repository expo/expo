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
    const attributes = {
      ...this.globalAttributes,
      ...options?.attributes,
      // Native keeps the display name as a reserved attribute; store the same record shape here.
      ...(options?.displayName != null ? { 'expo.log.display_name': options.displayName } : {}),
    };
    this.getWebMainSession().logs.push({
      timestamp: new Date().toISOString(),
      name,
      body: options?.body ?? null,
      attributes: Object.keys(attributes).length > 0 ? attributes : null,
      severity: options?.severity ?? 'info',
    });
  }
  setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null) {
    this.globalAttributes = { ...attributes };
  }
  setNetworkTracesConfig() {}
  async clearStoredEntries() {
    this.getWebMainSession().logs.length = 0;
  }
  async getInactiveSessions() {
    return [];
  }
  reportError() {}
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
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
