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
export type ExpoClientConfig = ExpoConfig & {
    /**
     * Published apps only.
     */
    releaseId?: string;
    revisionId?: string;
    releaseChannel?: string;
    bundleUrl: string;
    hostUri?: string;
    publishedTime?: string;
    /**
     * The Expo account name and slug for this project.
     * @deprecated Prefer `projectId` or `originalFullName` instead for identification and
     * `scopeKey` for scoping due to immutability.
     */
    id?: string;
    /**
     * The original Expo account name and slug for this project. Formatted like `@username/slug`.
     * When unauthenticated, the username is `@anonymous`. For published projects, this value
     * will not change when a project is transferred between accounts or renamed.
     */
    originalFullName?: string;
    /**
     * The Expo account name and slug used for display purposes. Formatted like `@username/slug`.
     * When unauthenticated, the username is `@anonymous`. For published projects, this value
     * may change when a project is transferred between accounts or renamed.
     */
    currentFullName?: string;
};
/**
 * Represents an intersection of all possible Config types.
 */
export type LegacyManifest = ExpoClientConfig & ExpoGoConfig & EASConfig & ClientScopingConfig & Record<string, any>;
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