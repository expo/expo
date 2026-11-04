import { NativeModule, registerWebModule, SharedObject } from 'expo';

import type { Session } from './Session';
import type { Span } from './Span';
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

class WebSpan extends globalThis.expo.SharedObject {
  // Fixed sentinels rather than empty strings: cross-platform code that logs or correlates ids
  // gets something recognizable on web instead of a value that reads as a bug.
  readonly traceId = 'web-trace';
  readonly spanId = 'web-span';

  setAttributes() {}
  addEvent() {}
  end() {}
}

class WebSession extends globalThis.expo.SharedObject {
  readonly id = 'web-session';
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
    return [];
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
  logEvent(name: string, options?: LogEventOptions) {}
  setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null) {}
  setNetworkTracesConfig() {}
  startSpan(): Span {
    return new WebSpan() as unknown as Span;
  }
  recordSpan() {}
  async clearStoredEntries() {}
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
