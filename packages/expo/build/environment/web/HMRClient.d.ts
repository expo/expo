declare type LogLevel = 'trace' | 'info' | 'warn' | 'error' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug';
export declare type HMRClientNativeInterface = {
    enable(): void;
    disable(): void;
    registerBundle(requestUrl: string): void;
    log(level: LogLevel, data: Array<any>): void;
    setup({ isEnabled: boolean }: {
        isEnabled: any;
    }): void;
};
/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
declare const HMRClient: HMRClientNativeInterface;
export default HMRClient;
//# sourceMappingURL=HMRClient.d.ts.map