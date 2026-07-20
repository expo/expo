import { NativeModule, registerWebModule } from 'expo';
import AppMetrics, { type LogEventOptions, type MetricAttributes } from 'expo-app-metrics';

import type {
  ObserveConfig,
  ObserveIntegrationsConfig,
  ObserveModule,
  ObserveModuleEvents,
  ObserveAttributes,
} from './types';

class ExpoObserveModule extends NativeModule<ObserveModuleEvents> implements ObserveModule {
  async dispatchEvents() {}
  configure(config: ObserveConfig): void {}
  getIntegrations(): ObserveIntegrationsConfig {
    return {};
  }
  logEvent(name: string, options?: LogEventOptions): void {
    AppMetrics.logEvent(name, options);
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
  setBundleDefaults(defaults: { environment: string; isJsDev: boolean }): void {}
}

export default registerWebModule(ExpoObserveModule, 'ExpoObserve');
