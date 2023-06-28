import { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import { RushConfiguration } from '@rushstack/rush-sdk';
import path from 'path';

import { PackageManagerOptions } from '../PackageManager';
import { BasePackageManager } from './BasePackageManager';

export class RushPackageManager extends BasePackageManager {
  readonly name = 'rush';
  // We run commands through Rush's bootstrap scripts (https://rushjs.io/pages/maintainer/enabling_ci_builds/#install-run-rushjs-for-bootstrapping-rush).
  readonly bin = 'node';
  readonly lockFile: string;
  readonly rushConfiguration: RushConfiguration;

  constructor(options: PackageManagerOptions = {}) {
    super(options);
    if (options.cwd === undefined) {
      throw new Error('cwd is required for constructing a RushPackageManager');
    }
    this.rushConfiguration = RushConfiguration.loadFromDefaultLocation({
      startingFolder: options.cwd.toString(),
    });
    this.lockFile = this.rushConfiguration.getCommittedShrinkwrapFilename();
  }

  runAsync(command: string[]) {
    // Script commands should run through rushx (https://rushjs.io/pages/commands/rushx/).
    const rushxScript = path.join(
      this.rushConfiguration.commonScriptsFolder,
      'install-run-rushx.js'
    );
    return super.runAsync([rushxScript, ...command]);
  }

  async versionAsync() {
    return this.rushConfiguration.rushConfigurationJson.rushVersion;
  }

  async getConfigAsync(key: string) {
    // Proxy the underlying package manager to get config keys.
    const packageManagerScript = path.join(
      this.rushConfiguration.commonScriptsFolder,
      `install-run-rush-${this.rushConfiguration.packageManager}.js`
    );
    const { stdout } = await super.runAsync([packageManagerScript, 'config', 'get', key]);
    // Rush's bootstrap scripts include some extra lines in stdout so we just want to grab the final one.
    const lines = stdout.split('\n');
    return lines[lines.length - 1].trim();
  }

  workspaceRoot() {
    return new RushPackageManager({
      ...this.options,
      silent: this.silent,
      log: this.log,
      cwd: this.rushConfiguration.rushJsonFolder,
    });
  }

  installAsync(namesOrFlags: string[] = []) {
    const project = this.rushConfiguration.tryGetProjectForPath(this.options.cwd!.toString());
    const projectFilter = project ? ['--to', project.packageName] : [];
    return this.runRush(['install', ...projectFilter, ...namesOrFlags]);
  }

  async uninstallAsync() {
    await this.runRush(['purge']);
  }

  addAsync(namesOrFlags: string[] = []): SpawnPromise<SpawnResult> {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }
    const { packages, flags } = parseNamesOrFlags(namesOrFlags);
    const packagesArguments = packages.map((pkg) => ['--package', pkg]).flat();

    return this.runRush(['add', ...packagesArguments, ...flags]);
  }

  addDevAsync(namesOrFlags: string[] = []) {
    return this.addAsync(['--dev', ...namesOrFlags]);
  }

  addGlobalAsync(): SpawnPromise<SpawnResult> {
    throw new Error('addGlobalAsync not implemented for RushPackageManager.');
  }

  removeAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }
    const { packages, flags } = parseNamesOrFlags(namesOrFlags);
    const packagesArguments = packages.map((pkg) => ['--package', pkg]).flat();
    return this.runRush(['remove', ...packagesArguments, ...flags]);
  }

  removeDevAsync(namesOrFlags: string[] = []): SpawnPromise<SpawnResult> {
    return this.removeAsync(['--dev', ...namesOrFlags])
  }

  removeGlobalAsync(): SpawnPromise<SpawnResult> {
    throw new Error('removeGlobalAsync not implemented for RushPackageManager.');
  }

  private runRush(command: string[]): SpawnPromise<SpawnResult> {
    const rushScript = path.join(this.rushConfiguration.commonScriptsFolder, 'install-run-rush.js');
    return super.runAsync([rushScript, ...command]);
  }
}

function parseNamesOrFlags(namesOrFlags: string[]): { flags: string[]; packages: string[] } {
  const flags = namesOrFlags.filter((value) => value.startsWith('-'));
  // Rush supports version specifiers for packages so we can just take the packages (https://rushjs.io/pages/commands/rush_add/).
  const packages = namesOrFlags.filter((value) => !value.startsWith('-'));
  return { packages, flags };
}
