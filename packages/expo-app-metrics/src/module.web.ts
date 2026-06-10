import { NativeModule, registerWebModule, SharedObject } from 'expo';

import type {
  ExpoAppMetricsModuleType,
  LogAttributeValue,
  LogEventOptions,
  Metric,
  MetricAttributes,
  NetworkRequestObserverEvents,
} from './types';

export * from './types';

class NetworkRequestObserverWeb extends SharedObject<NetworkRequestObserverEvents> {
  // Web has no native interceptor, so this never emits. Kept as a no-op so cross-platform code
  // can construct it without guarding on Platform.OS.
}

class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
  NetworkRequestObserver =
    NetworkRequestObserverWeb as unknown as ExpoAppMetricsModuleType['NetworkRequestObserver'];

  addCustomMetricToSession(metric: Metric): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async markFirstRender() {}
  async markInteractive(attributes?: MetricAttributes) {}
  logEvent(name: string, options?: LogEventOptions) {}
  setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null) {}
  async clearStoredEntries() {}
  async getInactiveSessions() {
    return [];
  }
  simulateCrashReport() {}
  triggerCrash() {}
  async getMainSession() {
    return null;
  }
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
