type LogLevel = 'trace' | 'info' | 'warn' | 'error' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug';
/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
declare const HMRClient: {
    enable(): void;
    disable(): void;
    registerBundle(requestUrl: string): void;
    log(level: LogLevel, data: any[]): void;
    setup({ isEnabled }: {
        isEnabled: boolean;
    }): void;
    _onMetroError(data: unknown): void;
};
export default HMRClient;
//# sourceMappingURL=HMRClient.d.ts.map