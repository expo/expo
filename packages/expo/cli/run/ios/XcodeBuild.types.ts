export type XcodeConfiguration = 'Debug' | 'Release';

export type Options = {
  /** iOS device to target. */
  device?: string | boolean;
  /** Dev server port to use, ignored if `bundler` is `false`. */
  port?: number;
  /** Xcode scheme to build. */
  scheme?: string;
  /** Xcode configuration to build. Default `Debug` */
  configuration?: XcodeConfiguration;
  /** Should start the bundler dev server. */
  bundler?: boolean;
  /** Should install missing dependencies before building. */
  install?: boolean;
  /** Should use derived data for builds. */
  buildCache: boolean;
};

export type ProjectInfo = {
  isWorkspace: boolean;
  name: string;
};

export type BuildProps = {
  /** Root to the iOS native project. */
  projectRoot: string;
  /** Is the target a simulator. */
  isSimulator: boolean;
  xcodeProject: ProjectInfo;
  device: { name: string; udid: string };
  configuration: XcodeConfiguration;
  /** Disable the initial bundling from the native script. */
  shouldSkipInitialBundling: boolean;
  /** Skip opening the bundler from the native script. */
  shouldStartBundler: boolean;
  /** Should use derived data for builds. */
  buildCache: boolean;
  terminal?: string;
  /** Port to start the dev server. */
  port: number;
  scheme: string;
};
