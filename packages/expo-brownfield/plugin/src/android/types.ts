export interface EnvValue {
  variable: string;
}

export type PublicationType =
  | 'localMaven'
  | 'localDirectory'
  | 'remotePublic'
  | 'remotePrivate'
  | 'remotePrivateToken';

export interface LocalMavenPublication {
  type: 'localMaven';
}

export interface LocalDirectoryPublication {
  type: 'localDirectory';
  name?: string;
  path: string;
}

export interface RemotePublicPublication {
  type: 'remotePublic';
  name?: string;
  url: string | EnvValue;
  allowInsecure?: boolean;
}

export interface RemotePrivatePublication {
  type: 'remotePrivate';
  name?: string;
  url: string | EnvValue;
  username: string | EnvValue;
  password: string | EnvValue;
  allowInsecure?: boolean;
}

export type Publication =
  | LocalMavenPublication
  | LocalDirectoryPublication
  | RemotePublicPublication
  | RemotePrivatePublication;

export interface PluginConfig {
  /**
   * Whether to embed a JavaScript bundle in the debug AAR so the host app can run the React
   * Native screen without a Metro server. Pair it with `useDevSupport = false` when calling
   * `ReactNativeHostManager.initialize` to actually load the embedded bundle.
   *
   * Enabling this makes React Native bundle JavaScript for the `debug` variant, which adds the
   * bundling step to every debug build.
   *
   * @default false
   */
  bundleInDebug: boolean;
  group: string;
  libraryName: string;
  package: string;
  packagePath: string;
  projectRoot: string;
  publishing: Publication[];
  version: string;
}

export type AndroidPluginProps = Pick<
  PluginConfig,
  'bundleInDebug' | 'group' | 'libraryName' | 'package' | 'publishing' | 'version'
>;

export type PluginProps = Partial<AndroidPluginProps> | undefined;
