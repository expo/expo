import type { ExpoConfig } from 'expo/config';

// @docsMissing
export type ManifestAsset = {
  url: string;
};

export type ExpoClientConfig = ExpoConfig & {
  /**
   * Only present during development using `@expo/cli`.
   */
  hostUri?: string;
};

// @docsMissing
export type ManifestExtra = ClientScopingConfig & {
  expoClient?: ExpoClientConfig;
  expoGo?: ExpoGoConfig;
  eas?: EASConfig;
};

// @needsAudit
export type EASConfig = {
  /**
   * The ID for this project if it's using EAS. UUID. This value will not change when a project is
   * transferred between accounts or renamed.
   */
  projectId?: string;
};

// @needsAudit
export type ClientScopingConfig = {
  /**
   * An opaque unique string for scoping client-side data to this project. This value
   * will not change when a project is transferred between accounts or renamed.
   */
  scopeKey?: string;
};

// @docsMissing
export type ExpoGoConfig = {
  mainModuleName?: string;
  debuggerHost?: string;
  developer?: Record<string, any> & {
    tool?: string;
  };
  packagerOpts?: ExpoGoPackagerOpts;
};

// @docsMissing
export type ExpoGoPackagerOpts = Record<string, any> & {
  hostType?: string;
  dev?: boolean;
  strict?: boolean;
  minify?: boolean;
  urlType?: string;
  urlRandomness?: string;
  lanType?: string;
};

/**
 * A `expo-updates` manifest.
 */
export type ExpoUpdatesManifest = {
  id: string;
  createdAt: string;
  runtimeVersion: string;
  launchAsset: ManifestAsset;
  assets: ManifestAsset[];
  metadata: object;
  extra?: ManifestExtra;
};

/**
 * @deprecated renamed to `ExpoUpdatesManifest`, will be removed in a few versions.
 */
export type NewManifest = ExpoUpdatesManifest;

/**
 * An embedded manifest.
 *
 * Generated during build in **createManifest.js** build step script.
 */
export type EmbeddedManifest = {
  id: string;
  commitTime: number;
  assets: any[]; // intentionally underspecified for now since there are no uses in JS
};

/**
 * @deprecated Renamed to `EmbeddedManifest`, will be removed in a few versions.
 */
export type BareManifest = EmbeddedManifest;
