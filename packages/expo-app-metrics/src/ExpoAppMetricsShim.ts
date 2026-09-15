import { EventEmitter, NativeModule } from 'expo';

import type { Session } from './Session';
import type { ExpoAppMetricsModuleType, NetworkRequestObserverEvents, SessionType } from './types';

class NoopNetworkRequestObserver extends EventEmitter<NetworkRequestObserverEvents> {
  setFilter(): void {}
  release(): void {}
}

class NoopSession extends EventEmitter {
  readonly id = 'noop-session';
  readonly startDate = new Date().toISOString();

  constructor(readonly type: SessionType) {
    super();
  }

  async isActive(): Promise<boolean> {
    return true;
  }
  async getEndDate(): Promise<string | null> {
    return null;
  }
  async getMetrics() {
    return [];
  }
  async getLogs() {
    return [];
  }
  async addMetric(): Promise<void> {}
  release(): void {}
}

/**
 * The module's shape with nothing behind it. Web has no native implementation, and hosts such as
 * Expo Go leave the package out, so both stand this in for the native module: metric and log calls
 * are no-ops, session queries resolve to empty results, and the observer never emits.
 */
export class ExpoAppMetricsShim extends NativeModule implements ExpoAppMetricsModuleType {
  NetworkRequestObserver =
    NoopNetworkRequestObserver as unknown as ExpoAppMetricsModuleType['NetworkRequestObserver'];
  Session = NoopSession as unknown as typeof Session;

  private mainSession: Session | null = null;

  markFirstRender() {}
  markInteractive() {}
  logEvent() {}
  setGlobalAttributes() {}
  async clearStoredEntries() {}
  async getInactiveSessions() {
    return [];
  }
  reportError() {}
  getMainSession(): Session {
    this.mainSession ??= new NoopSession('main') as unknown as Session;
    return this.mainSession;
  }
  async getForegroundSession() {
    return null;
  }
}
