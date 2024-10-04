type ExpoGoProjectConfig = {
    mainModuleName?: string;
    debuggerHost?: string;
    logUrl?: string;
    developer?: {
        tool?: string;
        [key: string]: any;
    };
    packagerOpts?: ExpoGoPackagerOpts;
};
export type ExpoGoPackagerOpts = {
    hostType?: string;
    dev?: boolean;
    strict?: boolean;
    minify?: boolean;
    urlType?: string;
    urlRandomness?: string;
    lanType?: string;
    [key: string]: any;
};
/**
 * Returns a boolean value whether the app is running in Expo Go.
 */
export declare function isRunningInExpoGo(): boolean;
/**
 * @hidden
 * Returns an Expo Go project config from the manifest or `null` if the app is not running in Expo Go.
 */
export declare function getExpoGoProjectConfig(): ExpoGoProjectConfig | null;
export {};
//# sourceMappingURL=ExpoGo.d.ts.map