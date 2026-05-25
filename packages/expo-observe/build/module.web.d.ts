import { NativeModule } from 'expo';
import { type LogEventOptions, type MetricAttributes } from 'expo-app-metrics';
import type { ObserveConfig, ObserveModule, ObserveAttributes } from './types';
declare class ExpoObserveModule extends NativeModule implements ObserveModule {
    dispatchEvents(): Promise<void>;
    configure(config: ObserveConfig): void;
    logEvent(name: string, options?: LogEventOptions): void;
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