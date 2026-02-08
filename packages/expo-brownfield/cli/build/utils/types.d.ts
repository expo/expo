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
export interface IosConfig extends CommonConfig {
}
export interface TasksConfigAndroid extends CommonConfig {
    library: string;
}
