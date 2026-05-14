import { NativeModule } from 'expo';
import type { Session as SessionType } from './Session';
import type { ExpoAppMetricsModuleType, LogEventOptions, MainSession, MetricAttributes } from './types';
export * from './types';
declare class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
    markFirstRender(): Promise<void>;
    markInteractive(_attributes?: MetricAttributes): Promise<void>;
    logEvent(_name: string, _options?: LogEventOptions): void;
    getStoredEntries(): Promise<never[]>;
    clearStoredEntries(): Promise<void>;
    getAllSessions(): Promise<SessionType[]>;
    simulateCrashReport(): void;
    triggerCrash(): void;
    getMainSession(): Promise<MainSession | null>;
    Session: typeof SessionType;
}
declare const _default: typeof ExpoAppMetricsModule;
export default _default;
//# sourceMappingURL=module.web.d.ts.map