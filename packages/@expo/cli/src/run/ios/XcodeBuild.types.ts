import { BuildCacheProvider } from '@expo/config';

import { OSType } from '../../start/platforms/ios/simctl';
import { BundlerProps } from '../resolveBundlerProps';

export type XcodeConfiguration = 'Debug' | 'Release';

export type Options = {
  /** iOS device to target. Use "generic" for a build-only workflow without a specific device. */
  device?: string | boolean;
  /** Dev server port to use, ignored if `bundler` is `false`. */
  port?: number;
  /** Xcode scheme to build. */
  scheme?: string | boolean;
  /** Xcode configuration to build. Default `Debug` */
  configuration?: XcodeConfiguration;
  /** Should start the bundler dev server. */
  bundler?: boolean;
  /** Should install missing dependencies before building. */
  install?: boolean;
  /** Should use derived data for builds. */
  buildCache?: boolean;
  /** Path to an existing binary to install on the device. */
  binary?: string;
  /** Directory to copy the built app binary to after build completes. */
  output?: string;

  /** Re-bundle JS and assets, then embed in existing app, and install again. */
  rebundle?: boolean;
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
  /** Device to build for. When `null`, uses generic destination for build-only workflow. */
  device: { name: string; udid: string; osType: OSType } | null;
  /** OS type from scheme resolution, used for generic destination when device is null. */
  osType: OSType;
  configuration: XcodeConfiguration;
  /** Disable the initial bundling from the native script. */
  shouldSkipInitialBundling: boolean;
  /** Should use derived data for builds. */
  buildCache: boolean;
  scheme: string;
  buildCacheProvider?: BuildCacheProvider;

  /** Options that were used to create the eager bundle in release builds. */
  eagerBundleOptions?: string;
} & BundlerProps;
