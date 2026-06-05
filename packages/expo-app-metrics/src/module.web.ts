import { NativeModule, registerWebModule } from 'expo';

import type { Session } from './Session';
import type {
  CrashReport,
  ExpoAppMetricsModuleType,
  LogAttributeValue,
  LogEventOptions,
  LogRecord,
  Metric,
  MetricAttributes,
  MetricInput,
  SessionType,
} from './types';

export * from './types';

class WebSession extends globalThis.expo.SharedObject {
  readonly id = 'web-session';
  readonly type: SessionType = 'main';
  readonly startDate = new Date().toISOString();
  readonly hasCrashReport = false;

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
  async getCrashReport(): Promise<CrashReport | null> {
    return null;
  }
  async addMetric(_metric: MetricInput): Promise<void> {}
}

class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
  Session = WebSession as unknown as typeof Session;
  private mainSession: WebSession | null = null;

  async markFirstRender() {}
  async markInteractive(attributes?: MetricAttributes) {}
  logEvent(name: string, options?: LogEventOptions) {}
  setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null) {}
  async clearStoredEntries() {}
  async getAllSessions(): Promise<Session[]> {
    return [];
  }
  simulateCrashReport() {}
  triggerCrash() {}
  getMainSession(): Session {
    if (!this.mainSession) {
      this.mainSession = new WebSession();
    }
    return this.mainSession as unknown as Session;
  }
}

export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
