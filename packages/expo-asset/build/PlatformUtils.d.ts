export declare const IS_MANAGED_ENV = true;
export declare const IS_BARE_ENV_WITH_UPDATES = false;
export declare const IS_ENV_WITH_UPDATES_ENABLED = true;
export declare const IS_BARE_ENV_WITHOUT_UPDATES = false;
export declare function getLocalAssets(): any;
export declare function getManifest(): {
    [key: string]: any;
};
export declare const manifestBaseUrl: string | null;
export declare function downloadAsync(uri: any, hash: any, type: any, name: any): Promise<string>;
