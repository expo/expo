import chalk from 'chalk';
import { StdioOptions } from 'child_process';
import path from 'path';

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
  preserve_paths: string | string[];
  compiler_flags: string;
  frameworks: string | string[];
  pod_target_xcconfig: Record<string, string>;
  xcconfig: Record<string, string>;
  dependencies?: Record<string, any>;
  info_plist: Record<string, string>;
  ios?: Podspec;
};

export type PodfileTargetDefinition = {
  name: string;
  children?: PodfileTargetDefinition[];
  dependencies?: Array<string | { [name: string]: [string] | Record<string, any>[] }>;
  // some other stuff that were not yet needed
};

/**
 * JSON representation fo the podfile.
 */
export type Podfile = {
  target_definitions: PodfileTargetDefinition[];
  installation_method: {
    name: 'cocoapods';
    options: Record<string, any>;
  };
};

/**
 * Reads the podspec and returns it in JSON format.
 */
export async function readPodspecAsync(podspecPath: string): Promise<Podspec> {
  return await spawnJSONCommandAsync('pod', ['ipc', 'spec', podspecPath]);
}

/**
 * Reads the podfile and returns it in JSON format.
 */
export async function readPodfileAsync(podfilePath: string): Promise<Podfile> {
  const child = await spawnAsync('pod', ['ipc', 'podfile-json', podfilePath], { cwd: path.dirname(podfilePath) });
  const jsonRegex = /\{".*":.*\}/;
  const jsonOutput = child.stdout.match(jsonRegex)?.[0] ?? '<no match>';
  try {
    // clean JSON output is polluted with some other logs coming from autolinking mechanism
    return JSON.parse(jsonOutput);
  } catch (e) {
    e.message +=
      '\n' + chalk.red('Cannot parse this output as JSON: ') + chalk.yellow(jsonOutput);
    throw e;
  }
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
