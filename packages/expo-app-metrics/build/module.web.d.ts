import { NativeModule } from 'expo';
import type { ExpoAppMetricsModuleType, LogAttributeValue, LogEventOptions, Metric, MetricAttributes } from './types';
export * from './types';
declare class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
    addCustomMetricToSession(metric: Metric): Promise<void>;
    markFirstRender(): Promise<void>;
    markInteractive(attributes?: MetricAttributes): Promise<void>;
    logEvent(name: string, options?: LogEventOptions): void;
    setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null): void;
    clearStoredEntries(): Promise<void>;
    getAllSessions(): Promise<never[]>;
    simulateCrashReport(): void;
    triggerCrash(): void;
    getMainSession(): Promise<null>;
}
declare const _default: typeof ExpoAppMetricsModule;
export default _default;
//# sourceMappingURL=module.web.d.ts.map