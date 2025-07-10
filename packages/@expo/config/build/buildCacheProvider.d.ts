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
export type ResolveBuildCacheProps = {
    projectRoot: string;
    platform: 'android' | 'ios';
    runOptions: RunOptions;
    fingerprintHash: string;
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
    calculateFingerprintHash?: (props: CalculateFingerprintHashProps, options: T) => Promise<string | null>;
} & ({
    resolveBuildCache(props: ResolveBuildCacheProps, options: T): Promise<string | null>;
    uploadBuildCache(props: UploadBuildCacheProps, options: T): Promise<string | null>;
} | {
    /**
     * @deprecated Use `resolveBuildCache` instead.
     */
    resolveRemoteBuildCache: (props: ResolveRemoteBuildCacheProps, options: T) => Promise<string | null>;
    /**
     * @deprecated Use `uploadBuildCache` instead.
     */
    uploadRemoteBuildCache: (props: UploadRemoteBuildCacheProps, options: T) => Promise<string | null>;
});
export {};
