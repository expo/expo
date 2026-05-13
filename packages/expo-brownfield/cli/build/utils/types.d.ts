export type Platform = 'android' | 'ios';
export interface RunCommandOptions {
    cwd?: string;
    env?: Record<string, string>;
    verbose?: boolean;
}
export interface RunCommandResult {
    stdout: string;
}
export interface WithSpinnerParams<T> {
    operation: () => Promise<T>;
    loaderMessage: string;
    successMessage?: string;
    errorMessage?: string;
    onError?: 'error' | 'warn';
    verbose?: boolean;
}
export interface CommonConfig {
    dryRun: boolean;
    verbose: boolean;
}
export type BuildVariant = 'All' | 'Debug' | 'Release';
export interface AndroidConfig extends CommonConfig {
    library: string;
    tasks: string[];
    variant: BuildVariant;
}
export interface PackageConfiguration {
    packageName: string;
}
export type BuildConfiguration = 'Debug' | 'Release';
export interface IosConfig extends CommonConfig {
    artifacts: string;
    buildConfiguration: BuildConfiguration;
    derivedDataPath: string;
    device: string;
    output: 'frameworks' | PackageConfiguration;
    scheme: string;
    simulator: string;
    usePrebuilds: boolean;
    workspace: string;
}
export interface ModuleXCFramework {
    /** XCFramework basename (e.g. `ExpoImage`, `SDWebImage`). Becomes the binaryTarget name. */
    name: string;
    /** Absolute path to the owning `Pods/<PodName>/` directory. */
    podDir: string;
    /** Absolute path to the `<name>.xcframework` directory. */
    xcframeworkPath: string;
    /**
     * The pod's main product name — the one that matches the `artifacts/<product>-{debug,release}.tar.gz`
     * tarball pattern. Differs from `name` for SPM-dependency xcframeworks (e.g. SDWebImage bundled
     * alongside ExpoImage has `name: "SDWebImage"` but `mainProduct: "ExpoImage"`).
     */
    mainProduct: string;
}
export interface TasksConfigAndroid extends CommonConfig {
    library: string;
}
export interface XCFrameworkSpec {
    name: string;
    path: string;
    targets: string[];
}
