import { ExpoConfig } from '@expo/config-types';
export interface ManifestAsset {
    url: string;
}
export type ManifestExtra = ClientScopingConfig & {
    expoClient?: ExpoConfig & {
        /**
         * Only present during development using @expo/cli.
         */
        hostUri?: string;
    };
    expoGo?: ExpoGoConfig;
    eas?: EASConfig;
};
export type EASConfig = {
    /**
     * The ID for this project if it's using EAS. UUID. This value will not change when a project is
     * transferred between accounts or renamed.
     */
    projectId?: string;
};
export type ClientScopingConfig = {
    /**
     * An opaque unique string for scoping client-side data to this project. This value
     * will not change when a project is transferred between accounts or renamed.
     */
    scopeKey?: string;
};
export type ExpoGoConfig = {
    mainModuleName?: string;
    debuggerHost?: string;
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
 * A modern manifest.
 */
export type NewManifest = {
    id: string;
    createdAt: string;
    runtimeVersion: string;
    launchAsset: ManifestAsset;
    assets: ManifestAsset[];
    metadata: object;
    extra?: ManifestExtra;
};
/**
 * An embedded bare manifest.
 *
 * Generated during build in createManifest.js build step script.
 */
export type BareManifest = {
    id: string;
    commitTime: number;
    assets: any[];
};
//# sourceMappingURL=Manifests.d.ts.map