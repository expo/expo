import { NativeModule, registerWebModule, SharedObject } from 'expo';

import type { ExpoAppMetricsModuleType, LogEventOptions, MetricAttributes, Session } from './types';

export * from './types';

// `getMainSession()` returns `null` and `getAllSessions()` returns `[]` on web,
// so the class is never instantiated — it only exists to satisfy the typed
// `Session` slot on the module surface.
class WebSession extends SharedObject {}

class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
  async markFirstRender() {}
  async markInteractive(_attributes?: MetricAttributes) {}
  logEvent(_name: string, _options?: LogEventOptions) {}
  async getStoredEntries() {
    return [];
  }
  async clearStoredEntries() {}
  async getAllSessions(): Promise<Session[]> {
    return [];
  }
  simulateCrashReport() {}
  triggerCrash() {}
  async getMainSession(): Promise<Session | null> {
    return null;
  }
  Session = WebSession as unknown as typeof Session;
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
