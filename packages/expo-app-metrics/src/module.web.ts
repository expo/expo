import { NativeModule, registerWebModule } from 'expo';

import type { ExpoAppMetricsModuleType, MetricAttributes } from './types';

export * from './types';

class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
  addCustomMetricToSession(
    sessionId: string,
    metric: { category: string; name: string; value: number }
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async markFirstRender() {}
  async markInteractive(_attributes?: MetricAttributes) {}
  async getStoredEntries() {
    return [];
  }
  async clearStoredEntries() {}
  async getAllSessions() {
    return [];
  }
  simulateCrashReport() {}
  triggerCrash() {}
  startSession(metadata?: string) {
    return '';
  }
  stopSession(sessionId: string) {}
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
