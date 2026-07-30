import { NativeModule } from 'expo';
import { type LogEventOptions, type MetricAttributes } from 'expo-app-metrics';
import type { ObserveConfig, ObserveIntegrationsConfig, ObserveModule, ObserveModuleEvents, ObserveAttributes } from './types';
declare class ExpoObserveModule extends NativeModule<ObserveModuleEvents> implements ObserveModule {
    dispatchEvents(): Promise<void>;
    configure(config: ObserveConfig): void;
    getIntegrations(): ObserveIntegrationsConfig;
    registerIntegration<K extends keyof ObserveIntegrationsConfig>(name: K, callback: (config: ObserveIntegrationsConfig[K]) => void): void;
    logEvent(name: string, options?: LogEventOptions): void;
    reportError(error: unknown): void;
    markFirstRender(): void;
    markInteractive(attributes?: MetricAttributes): void;
    setGlobalAttributes(attributes?: ObserveAttributes | null): void;
    setBundleDefaults(defaults: {
        environment: string;
        isJsDev: boolean;
    }): void;
}
declare const _default: typeof ExpoObserveModule;
export default _default;
//# sourceMappingURL=module.web.d.ts.map