import Constants from 'expo-constants';
export declare const IS_MANAGED_ENV: boolean;
export declare const IS_BARE_ENV_WITH_UPDATES: boolean;
export declare const IS_ENV_WITH_UPDATES_ENABLED: boolean;
export declare const IS_BARE_ENV_WITHOUT_UPDATES: boolean;
export declare function getLocalAssets(): any;
export declare function getManifest(): {
    [key: string]: any;
};
export declare function getManifest2(): typeof Constants.__unsafeNoWarnManifest2 | undefined;
export declare const manifestBaseUrl: string | null;
export declare function downloadAsync(uri: any, hash: any, type: any, name: any): Promise<string>;
//# sourceMappingURL=PlatformUtils.d.ts.map