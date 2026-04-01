declare const _default: {
    markInteractive(): void;
    markFirstRender(): void;
    getStoredEntries(): Promise<import("./types").Metric[]>;
    clearStoredEntries(): Promise<void>;
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