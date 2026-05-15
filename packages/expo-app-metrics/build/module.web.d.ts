import { NativeModule } from 'expo';
import type { ExpoAppMetricsModuleType, LogEventOptions, MetricAttributes, Session } from './types';
export * from './types';
declare class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
    markFirstRender(): Promise<void>;
    markInteractive(_attributes?: MetricAttributes): Promise<void>;
    logEvent(_name: string, _options?: LogEventOptions): void;
    getStoredEntries(): Promise<never[]>;
    clearStoredEntries(): Promise<void>;
    getAllSessions(): Promise<Session[]>;
    simulateCrashReport(): void;
    triggerCrash(): void;
    getMainSession(): Promise<Session | null>;
    Session: typeof Session;
}
declare const _default: typeof ExpoAppMetricsModule;
export default _default;
//# sourceMappingURL=module.web.d.ts.map