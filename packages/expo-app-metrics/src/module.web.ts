import { NativeModule, registerWebModule } from 'expo';

import type { ExpoAppMetricsModuleType, LogEventOptions, Metric, MetricAttributes } from './types';

export * from './types';

class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
  addCustomMetricToSession(metric: Metric): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async markFirstRender() {}
  async markInteractive(attributes?: MetricAttributes) {}
  logEvent(name: string, options?: LogEventOptions) {}
  async getStoredEntries() {
    return [];
  }
  async clearStoredEntries() {}
  async getAllSessions() {
    return [];
  }
  simulateCrashReport() {}
  triggerCrash() {}
  async getMainSession() {
    return null;
  }
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
