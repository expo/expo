export type BuildTypeCommon = 'debug' | 'release';

export type BuildTypeAndroid = BuildTypeCommon | 'all';

export interface BuildConfigCommon {
  dryRun: boolean;
  help: boolean;
  verbose: boolean;
}

export interface BuildConfigAndroid extends BuildConfigCommon {
  buildType: BuildTypeAndroid;
  libraryName: string;
  repositories: string[];
  tasks: string[];
}

export interface BuildConfigIos extends BuildConfigCommon {
  artifacts: string;
  buildType: BuildTypeCommon;
  derivedDataPath: string;
  device: string;
  hermesFrameworkPath: string;
  scheme: string;
  simulator: string;
  workspace: string;
}

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
