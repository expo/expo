type AndroidRunOptions = {
  variant?: string;
  device?: boolean | string;
  port?: number;
  bundler?: boolean;
  install?: boolean;
  buildCache?: boolean;
  allArch?: boolean;
  binary?: string;
  appId?: string;
};

type IosRunOptions = {
  /** iOS device to target. */
  device?: string | boolean;
  /** Dev server port to use, ignored if `bundler` is `false`. */
  port?: number;
  /** Xcode scheme to build. */
  scheme?: string | boolean;
  /** Xcode configuration to build. Default `Debug` */
  configuration?: 'Debug' | 'Release';
  /** Should start the bundler dev server. */
  bundler?: boolean;
  /** Should install missing dependencies before building. */
  install?: boolean;
  /** Should use derived data for builds. */
  buildCache?: boolean;
  /** Path to an existing binary to install on the device. */
  binary?: string;

  /** Re-bundle JS and assets, then embed in existing app, and install again. */
  rebundle?: boolean;
};

export type RunOptions = AndroidRunOptions | IosRunOptions;

/** The device the cached build will be installed on. */
export type BuildCacheDevice = {
  /** Device identifier. On iOS, this is the UDID of the simulator or physical device. */
  id: string;
  /** Whether the device is a simulator or a physical device. */
  type: 'simulator' | 'device';
};

export type ResolveBuildCacheProps = {
  projectRoot: string;
  platform: 'android' | 'ios';
  runOptions: RunOptions;
  fingerprintHash: string;
  /**
   * The device the build will be installed on. Only set when targeting a specific iOS device,
   * not for generic builds (`--device generic`).
   */
  device?: BuildCacheDevice;
};

/**
 * @deprecated Use `ResolveBuildCacheProps` instead.
 */
export type ResolveRemoteBuildCacheProps = ResolveBuildCacheProps;

export type UploadBuildCacheProps = {
  projectRoot: string;
  buildPath: string;
  runOptions: RunOptions;
  fingerprintHash: string;
  platform: 'android' | 'ios';
};
/**
 * @deprecated Use `ResolveBuildCacheProps` instead.
 */
export type UploadRemoteBuildCacheProps = UploadBuildCacheProps;

export type CalculateFingerprintHashProps = {
  projectRoot: string;
  platform: 'android' | 'ios';
  runOptions: RunOptions;
};

export type BuildCacheProvider<T = any> = {
  plugin: BuildCacheProviderPlugin<T>;
  options: T;
};

export type BuildCacheProviderPlugin<T = any> = {
  calculateFingerprintHash?: (
    props: CalculateFingerprintHashProps,
    options: T
  ) => Promise<string | null>;
  /**
   * Set to `true` to let `npx expo run:ios` resolve cached builds for physical iOS devices.
   * By default, only iOS Simulator builds are resolved from the cache.
   *
   * When enabled, `resolveBuildCache` receives the target device in `props.device`. Return a build
   * only if its provisioning profile includes `props.device.id`, otherwise return `null` so the
   * project is built locally. The returned build is installed on the device just like `--binary`.
   *
   * Builds for physical iOS devices are never uploaded with `uploadBuildCache`.
   */
  supportsIosPhysicalDevices?: boolean;
} & (
  | {
      resolveBuildCache(props: ResolveBuildCacheProps, options: T): Promise<string | null>;
      uploadBuildCache(props: UploadBuildCacheProps, options: T): Promise<string | null>;
    }
  | {
      /**
       * @deprecated Use `resolveBuildCache` instead.
       */
      resolveRemoteBuildCache: (
        props: ResolveRemoteBuildCacheProps,
        options: T
      ) => Promise<string | null>;
      /**
       * @deprecated Use `uploadBuildCache` instead.
       */
      uploadRemoteBuildCache: (
        props: UploadRemoteBuildCacheProps,
        options: T
      ) => Promise<string | null>;
    }
);
