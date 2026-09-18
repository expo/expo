import { NativeModule, registerWebModule } from 'expo';
import AppMetrics, { type LogEventOptions, type MetricAttributes } from 'expo-app-metrics';

import { applyConfig } from './applyConfig';
import { registerIntegrationImpl } from './registerIntegration';
import { reportCaughtError } from './reportCaughtError';
import type {
  ObserveConfig,
  ObserveIntegrationsConfig,
  ObserveModule,
  ObserveModuleEvents,
  ObserveAttributes,
} from './types';
import { dispatch, setDispatchBundleDefaults, setDispatchConfig } from './web/dispatch';
import type { BundleDefaults } from './web/types';

class ExpoObserveModule extends NativeModule<ObserveModuleEvents> implements ObserveModule {
  private lastIntegrations: ObserveIntegrationsConfig = {};

  get clientId(): string | null {
    // The EAS client id is stored in native preferences, which web has no equivalent of.
    return null;
  }
  dispatchEvents(): Promise<void> {
    return dispatch();
  }
  configure(config: ObserveConfig): void {
    setDispatchConfig(config);
    // Without the opt-in, Observe stays a no-op on web.
    if (!config.web) {
      return;
    }
    applyConfig(config);
    // Broadcast the integrations config so integration libraries (e.g. expo-image) can activate.
    this.lastIntegrations = { ...config.integrations };
    this.emit('configure', { integrations: this.lastIntegrations });
  }
  getIntegrations(): ObserveIntegrationsConfig {
    return this.lastIntegrations;
  }
  registerIntegration<K extends keyof ObserveIntegrationsConfig>(
    name: K,
    callback: (config: ObserveIntegrationsConfig[K]) => void
  ): void {
    registerIntegrationImpl(this, name, callback);
  }
  logEvent(name: string, options?: LogEventOptions): void {
    AppMetrics.logEvent(name, options);
  }
  reportError(error: unknown): void {
    reportCaughtError(error);
  }
  markFirstRender(): void {
    AppMetrics.markFirstRender();
  }
  markInteractive(attributes?: MetricAttributes): void {
    AppMetrics.markInteractive(attributes);
  }
  setGlobalAttributes(attributes?: ObserveAttributes | null): void {
    AppMetrics.setGlobalAttributes(attributes);
  }
  setBundleDefaults(defaults: BundleDefaults): void {
    setDispatchBundleDefaults(defaults);
  }
}

export default registerWebModule(ExpoObserveModule, 'ExpoObserve');
