import { NativeModule } from 'expo';
import type { ExpoAppMetricsModuleType, MetricAttributes } from './types';
export * from './types';
declare class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
    addCustomMetricToSession(sessionId: string, metric: {
        category: string;
        name: string;
        value: number;
    }): Promise<void>;
    markFirstRender(): Promise<void>;
    markInteractive(_attributes?: MetricAttributes): Promise<void>;
    getStoredEntries(): Promise<never[]>;
    clearStoredEntries(): Promise<void>;
    getAllSessions(): Promise<never[]>;
    simulateCrashReport(): void;
    triggerCrash(): void;
    startSession(metadata?: string): string;
    stopSession(sessionId: string): void;
}
declare const _default: typeof ExpoAppMetricsModule;
export default _default;
//# sourceMappingURL=module.web.d.ts.map