import { StdioOptions } from 'child_process';

import { spawnAsync, spawnJSONCommandAsync } from './Utils';

/**
 * JSON representation of the podspec.
 */
export type Podspec = {
  name: string;
  version: string;
  platforms: Record<string, string>;
  header_dir?: string;
  source_files: string | string[];
  exclude_files: string | string[];
  public_header_files?: string | string[];
  preserve_paths: string | string[];
  compiler_flags: string;
  frameworks: string | string[];
  vendored_frameworks: string | string[];
  pod_target_xcconfig: Record<string, string>;
  xcconfig: Record<string, string>;
  dependencies: Record<string, any>;
  info_plist: Record<string, string>;
  ios?: Podspec;
  default_subspecs: string | string[];
  subspecs: Podspec[];
};

/**
 * Reads the podspec and returns it in JSON format.
 */
export async function readPodspecAsync(podspecPath: string): Promise<Podspec> {
  return await spawnJSONCommandAsync('pod', ['ipc', 'spec', podspecPath]);
}

type PodInstallOptions = Partial<{
  /**
   * Whether to use `--no-repo-update` flag.
   */
  noRepoUpdate: boolean;

  /**
   * stdio passed to the child process.
   */
  stdio: StdioOptions;
}>;

/**
 * Installs pods under given project path.
 */
export async function podInstallAsync(
  projectPath: string,
  options: PodInstallOptions = { noRepoUpdate: false, stdio: 'pipe' }
): Promise<void> {
  const args = ['install'];

  if (options.noRepoUpdate) {
    args.push('--no-repo-update');
  }
  await spawnAsync('pod', args, {
    cwd: projectPath,
    stdio: options.stdio ?? 'pipe',
  });
}

/**
 * An alternative version of `podInstallAsync` that uses `npx pod-install` command.
 * See https://github.com/expo/expo-cli/tree/main/packages/pod-install
 */
export async function npxPodInstallAsync(
  projectPath: string,
  verbose: boolean = false
): Promise<void> {
  const args = ['pod-install@latest'];

  if (!verbose) {
    args.push('--quiet');
  }
  await spawnAsync('npx', args, {
    cwd: projectPath,
    stdio: verbose ? 'inherit' : 'pipe',
  });
}
