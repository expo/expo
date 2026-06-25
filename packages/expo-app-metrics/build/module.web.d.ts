import { NativeModule } from 'expo';
import type { Session } from './Session';
import type { ExpoAppMetricsModuleType, LogAttributeValue, LogEventOptions, MetricAttributes } from './types';
export * from './types';
declare class ExpoAppMetricsModule extends NativeModule implements ExpoAppMetricsModuleType {
    NetworkRequestObserver: ExpoAppMetricsModuleType["NetworkRequestObserver"];
    Session: typeof Session;
    private mainSession;
    markFirstRender(): Promise<void>;
    markInteractive(attributes?: MetricAttributes): Promise<void>;
    logEvent(name: string, options?: LogEventOptions): void;
    setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null): void;
    clearStoredEntries(): Promise<void>;
    getInactiveSessions(): Promise<never[]>;
    reportError(): void;
    getMainSession(): Session;
    getForegroundSession(): Promise<null>;
}
declare const _default: typeof ExpoAppMetricsModule;
export default _default;
//# sourceMappingURL=module.web.d.ts.map