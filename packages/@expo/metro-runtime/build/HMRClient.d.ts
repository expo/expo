type LogLevel = 'trace' | 'info' | 'warn' | 'error' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug';
export type HMRClientNativeInterface = {
    enable(): void;
    disable(): void;
    registerBundle(requestUrl: string): void;
    log(level: LogLevel, data: any[]): void;
    setup(props: {
        isEnabled: boolean;
    }): void;
};
/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
declare const HMRClient: HMRClientNativeInterface;
export default HMRClient;
//# sourceMappingURL=HMRClient.d.ts.map