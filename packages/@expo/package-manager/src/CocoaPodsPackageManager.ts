import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { Ora } from 'ora';
import os from 'os';
import path from 'path';

import { PackageManager, spawnSudoAsync } from './PackageManager';

export type CocoaPodsErrorCode = 'NON_INTERACTIVE' | 'NO_CLI' | 'COMMAND_FAILED';

export class CocoaPodsError extends Error {
  readonly name = 'CocoaPodsError';
  readonly isPackageManagerError = true;

  constructor(message: string, public code: CocoaPodsErrorCode, public cause?: Error) {
    super(cause ? `${message}\n└─ Cause: ${cause.message}` : message);
  }
}

export function extractMissingDependencyError(errorOutput: string): [string, string] | null {
  // [!] Unable to find a specification for `expo-dev-menu-interface` depended upon by `expo-dev-launcher`
  const results = errorOutput.match(
    /Unable to find a specification for ['"`]([\w-_\d\s]+)['"`] depended upon by ['"`]([\w-_\d\s]+)['"`]/
  );
  if (results) {
    return [results[1], results[2]];
  }
  return null;
}

export class CocoaPodsPackageManager implements PackageManager {
  options: SpawnOptions;

  private silent: boolean;

  static getPodProjectRoot(projectRoot: string): string | null {
    if (CocoaPodsPackageManager.isUsingPods(projectRoot)) return projectRoot;
    const iosProject = path.join(projectRoot, 'ios');
    if (CocoaPodsPackageManager.isUsingPods(iosProject)) return iosProject;
    const macOsProject = path.join(projectRoot, 'macos');
    if (CocoaPodsPackageManager.isUsingPods(macOsProject)) return macOsProject;
    return null;
  }

  static isUsingPods(projectRoot: string): boolean {
    return existsSync(path.join(projectRoot, 'Podfile'));
  }

  static async gemInstallCLIAsync(
    nonInteractive: boolean = false,
    spawnOptions: SpawnOptions = { stdio: 'inherit' }
  ): Promise<void> {
    const options = ['install', 'cocoapods', '--no-document'];

    try {
      // In case the user has run sudo before running the command we can properly install CocoaPods without prompting for an interaction.
      await spawnAsync('gem', options, spawnOptions);
    } catch (error: any) {
      if (nonInteractive) {
        throw new CocoaPodsError(
          'Failed to install CocoaPods CLI with gem (recommended)',
          'COMMAND_FAILED',
          error
        );
      }
      // If the user doesn't have permission then we can prompt them to use sudo.
      await spawnSudoAsync(['gem', ...options], spawnOptions);
    }
  }

  static async brewLinkCLIAsync(spawnOptions: SpawnOptions = { stdio: 'inherit' }): Promise<void> {
    await spawnAsync('brew', ['link', 'cocoapods'], spawnOptions);
  }

  static async brewInstallCLIAsync(
    spawnOptions: SpawnOptions = { stdio: 'inherit' }
  ): Promise<void> {
    await spawnAsync('brew', ['install', 'cocoapods'], spawnOptions);
  }

  static async installCLIAsync({
    nonInteractive = false,
    spawnOptions = { stdio: 'inherit' },
  }: {
    nonInteractive?: boolean;
    spawnOptions?: SpawnOptions;
  }): Promise<boolean> {
    if (!spawnOptions) {
      spawnOptions = { stdio: 'inherit' };
    }
    const silent = !!spawnOptions.ignoreStdio;

    try {
      !silent && console.log(`\u203A Attempting to install CocoaPods CLI with Gem`);
      await CocoaPodsPackageManager.gemInstallCLIAsync(nonInteractive, spawnOptions);
      !silent && console.log(`\u203A Successfully installed CocoaPods CLI with Gem`);
      return true;
    } catch (error: any) {
      if (!silent) {
        console.log(chalk.yellow(`\u203A Failed to install CocoaPods CLI with Gem`));
        console.log(chalk.red(error.stderr ?? error.message));
        console.log(`\u203A Attempting to install CocoaPods CLI with Homebrew`);
      }
      try {
        await CocoaPodsPackageManager.brewInstallCLIAsync(spawnOptions);
        if (!(await CocoaPodsPackageManager.isCLIInstalledAsync(spawnOptions))) {
          try {
            await CocoaPodsPackageManager.brewLinkCLIAsync(spawnOptions);
            // Still not available after linking? Bail out
            if (!(await CocoaPodsPackageManager.isCLIInstalledAsync(spawnOptions))) {
              throw new CocoaPodsError(
                'CLI could not be installed automatically with gem or Homebrew, please install CocoaPods manually and try again',
                'NO_CLI',
                error
              );
            }
          } catch (error: any) {
            throw new CocoaPodsError(
              'Homebrew installation appeared to succeed but CocoaPods CLI not found in PATH and unable to link.',
              'NO_CLI',
              error
            );
          }
        }

        !silent && console.log(`\u203A Successfully installed CocoaPods CLI with Homebrew`);
        return true;
      } catch (error: any) {
        !silent &&
          console.warn(
            chalk.yellow(
              `\u203A Failed to install CocoaPods with Homebrew. Please install CocoaPods CLI manually and try again.`
            )
          );
        throw new CocoaPodsError(
          `Failed to install CocoaPods with Homebrew. Please install CocoaPods CLI manually and try again.`,
          'NO_CLI',
          error
        );
      }
    }
  }

  static isAvailable(projectRoot: string, silent: boolean): boolean {
    if (process.platform !== 'darwin') {
      !silent && console.log(chalk.red('CocoaPods is only supported on macOS machines'));
      return false;
    }
    if (!CocoaPodsPackageManager.isUsingPods(projectRoot)) {
      !silent && console.log(chalk.yellow('CocoaPods is not supported in this project'));
      return false;
    }
    return true;
  }

  static async isCLIInstalledAsync(
    spawnOptions: SpawnOptions = { stdio: 'inherit' }
  ): Promise<boolean> {
    try {
      await spawnAsync('pod', ['--version'], spawnOptions);
      return true;
    } catch {
      return false;
    }
  }

  constructor({ cwd, silent }: { cwd: string; silent?: boolean }) {
    this.silent = !!silent;
    this.options = {
      cwd,
      // We use pipe by default instead of inherit so that we can capture stderr/stdout and process it for errors.
      // Later we'll also pipe the stdout/stderr to the terminal when silent is false.
      stdio: 'pipe',
    };
  }

  get name() {
    return 'CocoaPods';
  }

  /** Runs `pod install` and attempts to automatically run known troubleshooting steps automatically. */
  async installAsync({ spinner }: { spinner?: Ora } = {}) {
    await this._installAsync({ spinner });
  }

  public isCLIInstalledAsync() {
    return CocoaPodsPackageManager.isCLIInstalledAsync(this.options);
  }

  public installCLIAsync() {
    return CocoaPodsPackageManager.installCLIAsync({
      nonInteractive: true,
      spawnOptions: this.options,
    });
  }

  async handleInstallErrorAsync({
    error,
    shouldUpdate = true,
    updatedPackages = [],
    spinner,
  }: {
    error: any;
    spinner?: Ora;
    shouldUpdate?: boolean;
    updatedPackages?: string[];
  }) {
    // Unknown errors are rethrown.
    if (!error.output) {
      throw error;
    }

    // To emulate a `pod install --repo-update` error, enter your `ios/Podfile.lock` and change one of `PODS` version numbers to some lower value.
    // const isPodRepoUpdateError = shouldPodRepoUpdate(output);
    if (!shouldUpdate) {
      // If we can't automatically fix the error, we'll just rethrow it with some known troubleshooting info.
      throw getImprovedPodInstallError(error, {
        cwd: this.options.cwd,
      });
    }

    // Collect all of the spawn info.
    const errorOutput = error.output.join(os.EOL).trim();

    // Extract useful information from the error message and push it to the spinner.
    const { updatePackage, shouldUpdateRepo } = getPodUpdateMessage(errorOutput);

    if (!updatePackage || updatedPackages.includes(updatePackage)) {
      // `pod install --repo-update`...
      // Attempt to install again but this time with install --repo-update enabled.
      return await this._installAsync({
        spinner,
        shouldRepoUpdate: true,
        // Include a boolean to ensure pod install --repo-update isn't invoked in the unlikely case where the pods fail to update.
        shouldUpdate: false,
        updatedPackages,
      });
    }
    // Store the package we should update to prevent a loop.
    updatedPackages.push(updatePackage);

    // If a single package is broken, we'll try to update it.
    // You can manually test this by changing a version number in your `Podfile.lock`.

    // Attempt `pod update <package> <--no-repo-update>` and then try again.
    return await this.runInstallTypeCommandAsync(
      ['update', updatePackage, shouldUpdateRepo ? '' : '--no-repo-update'].filter(Boolean),
      {
        formatWarning() {
          const updateMessage = `Failed to update ${chalk.bold(
            updatePackage
          )}. Attempting to update the repo instead.`;
          return updateMessage;
        },
        spinner,
        updatedPackages,
      }
    );
    // // If update succeeds, we'll try to install again (skipping `pod install --repo-update`).
    // return await this._installAsync({
    //   spinner,
    //   shouldUpdate: false,
    //   updatedPackages,
    // });
  }

  private async _installAsync({
    shouldRepoUpdate,
    ...props
  }: {
    spinner?: Ora;
    shouldUpdate?: boolean;
    updatedPackages?: string[];
    shouldRepoUpdate?: boolean;
  } = {}): Promise<SpawnResult> {
    return await this.runInstallTypeCommandAsync(
      ['install', shouldRepoUpdate ? '--repo-update' : ''].filter(Boolean),
      {
        formatWarning(error: any) {
          // Extract useful information from the error message and push it to the spinner.
          return getPodRepoUpdateMessage(error.output.join(os.EOL).trim()).message;
        },
        ...props,
      }
    );
  }

  private async runInstallTypeCommandAsync(
    command: string[],
    {
      formatWarning,
      ...props
    }: {
      formatWarning?: (error: Error) => string;
      spinner?: Ora;
      shouldUpdate?: boolean;
      updatedPackages?: string[];
    } = {}
  ): Promise<SpawnResult> {
    try {
      return await this._runAsync(command);
    } catch (error: any) {
      if (formatWarning) {
        const warning = formatWarning(error);
        if (props.spinner) {
          props.spinner.text = chalk.bold(warning);
        }
        if (!this.silent) {
          console.warn(chalk.yellow(warning));
        }
      }

      return await this.handleInstallErrorAsync({ error, ...props });
    }
  }

  async addWithParametersAsync(names: string[], parameters: string[]) {
    throw new Error('Unimplemented');
  }

  async addAsync(...names: string[]) {
    throw new Error('Unimplemented');
  }

  async addDevAsync(...names: string[]) {
    throw new Error('Unimplemented');
  }

  async versionAsync() {
    const { stdout } = await spawnAsync('pod', ['--version'], this.options);
    return stdout.trim();
  }

  async getConfigAsync(key: string): Promise<string> {
    throw new Error('Unimplemented');
  }

  async removeLockfileAsync() {
    throw new Error('Unimplemented');
  }

  async cleanAsync() {
    throw new Error('Unimplemented');
  }

  // Private
  private async podRepoUpdateAsync(): Promise<void> {
    try {
      await this._runAsync(['repo', 'update']);
    } catch (error: any) {
      error.message = error.message || (error.stderr ?? error.stdout);

      throw new CocoaPodsError(
        'The command `pod install --repo-update` failed',
        'COMMAND_FAILED',
        error
      );
    }
  }

  // Exposed for testing
  async _runAsync(args: string[]): Promise<SpawnResult> {
    if (!this.silent) {
      console.log(`> pod ${args.join(' ')}`);
    }
    const promise = spawnAsync(
      'pod',
      [
        ...args,
        // Enables colors while collecting output.
        '--ansi',
      ],
      {
        // Add the cwd and other options to the spawn options.
        ...this.options,
        // We use pipe by default instead of inherit so that we can capture stderr/stdout and process it for errors.
        // This is particularly required for the `pod install --repo-update` error.

        // Later we'll also pipe the stdout/stderr to the terminal when silent is false,
        // currently this means we lose out on the ansi colors unless passing the `--ansi` flag to every command.
        stdio: 'pipe',
      }
    );

    if (!this.silent) {
      // If not silent, pipe the stdout/stderr to the terminal.
      // We only do this when the `stdio` is set to `pipe` (collect the results for parsing), `inherit` won't contain `promise.child`.
      if (promise.child.stdout) {
        promise.child.stdout.pipe(process.stdout);
      }
    }

    return await promise;
  }
}

/** When pods are outdated, they'll throw an error informing you to run "pod install --repo-update" */
function shouldPodRepoUpdate(errorOutput: string) {
  const output = errorOutput;
  const isPodRepoUpdateError =
    output.includes('pod repo update') || output.includes('--no-repo-update');
  return isPodRepoUpdateError;
}

export function getPodUpdateMessage(output: string) {
  const props = output.match(
    /run ['"`]pod update ([\w-_\d/]+)( --no-repo-update)?['"`] to apply changes/
  );

  return {
    updatePackage: props?.[1] ?? null,
    shouldUpdateRepo: !props?.[2],
  };
}

export function getPodRepoUpdateMessage(errorOutput: string) {
  const warningInfo = extractMissingDependencyError(errorOutput);
  const brokenPackage = getPodUpdateMessage(errorOutput);

  let message: string;
  if (warningInfo) {
    message = `Couldn't install: ${warningInfo[1]} » ${chalk.underline(warningInfo[0])}.`;
  } else if (brokenPackage?.updatePackage) {
    message = `Couldn't install: ${brokenPackage?.updatePackage}.`;
  } else {
    message = `Couldn't install Pods.`;
  }
  message += ` Updating the Pods project and trying again...`;
  return { message, ...brokenPackage };
}

/**
 * Format the CocoaPods CLI install error.
 *
 * @param error Error from CocoaPods CLI `pod install` command.
 * @returns
 */
export function getImprovedPodInstallError(
  error: SpawnResult & Error,
  { cwd = process.cwd() }: { cwd?: string }
): Error {
  // Collect all of the spawn info.
  const errorOutput = error.output.join(os.EOL).trim();

  if (error.stdout.match(/No [`'"]Podfile[`'"] found in the project directory/)) {
    // Ran pod install but no Podfile was found.
    error.message = `No Podfile found in directory: ${cwd}. Ensure CocoaPods is setup any try again.`;
  } else if (shouldPodRepoUpdate(errorOutput)) {
    // Ran pod install but the install --repo-update step failed.
    const warningInfo = extractMissingDependencyError(errorOutput);
    let reason: string;
    if (warningInfo) {
      reason = `Couldn't install: ${warningInfo[1]} » ${chalk.underline(warningInfo[0])}`;
    } else {
      reason = `This is often due to native package versions mismatching`;
    }

    // Attempt to provide a helpful message about the missing NPM dependency (containing a CocoaPod) since React Native
    // developers will almost always be using autolinking and not interacting with CocoaPods directly.
    let solution: string;
    if (warningInfo?.[0]) {
      // If the missing package is named `expo-dev-menu`, `react-native`, etc. then it might not be installed in the project.
      if (warningInfo[0].match(/^(?:@?expo|@?react)(-|\/)/)) {
        solution = `Ensure the node module "${warningInfo[0]}" is installed in your project, then run 'npx pod-install' to try again.`;
      } else {
        solution = `Ensure the CocoaPod "${warningInfo[0]}" is installed in your project, then run 'npx pod-install' to try again.`;
      }
    } else {
      // Brute force
      solution = `Try deleting the 'ios/Pods' folder or the 'ios/Podfile.lock' file and running 'npx pod-install' to resolve.`;
    }
    error.message = `${reason}. ${solution}`;

    // Attempt to provide the troubleshooting info from CocoaPods CLI at the bottom of the error message.
    if (error.stdout) {
      const cocoapodsDebugInfo = error.stdout.split(os.EOL);
      // The troubleshooting info starts with `[!]`, capture everything after that.
      const firstWarning = cocoapodsDebugInfo.findIndex(v => v.startsWith('[!]'));
      if (firstWarning !== -1) {
        const warning = cocoapodsDebugInfo.slice(firstWarning).join(os.EOL);
        error.message += `\n\n${chalk.gray(warning)}`;
      }
    }
    return new CocoaPodsError(
      'Command `pod install --repo-update` failed.',
      'COMMAND_FAILED',
      error
    );
  } else {
    let stderr: string | null = error.stderr.trim();

    // CocoaPods CLI prints the useful error to stdout...
    const usefulError = error.stdout.match(/\[!\]\s((?:.|\n)*)/)?.[1];

    // If there is a useful error message then prune the less useful info.
    if (usefulError) {
      // Delete unhelpful CocoaPods CLI error message.
      if (error.message?.match(/pod exited with non-zero code: 1/)) {
        error.message = '';
      }
      stderr = null;
    }

    error.message = [usefulError, error.message, stderr].filter(Boolean).join('\n');
  }

  return new CocoaPodsError('Command `pod install` failed.', 'COMMAND_FAILED', error);
}
