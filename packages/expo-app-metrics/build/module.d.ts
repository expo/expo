import type { MetricAttributes } from './types';
declare const _default: {
    markInteractive(attributes?: MetricAttributes): void;
    markFirstRender(): void;
    getStoredEntries(): Promise<import("./types").Metric[]>;
    clearStoredEntries(): Promise<void>;
    getAllSessions(): Promise<import("./types").Session[]>;
    simulateCrashReport(): void;
    triggerCrash(kind: import("./types").CrashKind): void;
    startSession(): string;
    stopSession(sessionId: string): void;
    addCustomMetricToSession(sessionId: string, metric: {
        category: string;
        name: string;
        value: number;
        routeName?: string;
        params?: Record<string, unknown>;
    }): Promise<void>;
};
export default _default;
//# sourceMappingURL=module.d.ts.map