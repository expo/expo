import spawnAsync, { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import assert from 'assert';
import fs from 'fs';
import invariant from 'invariant';
import path from 'path';

import { PackageManager, PackageManagerOptions } from '../PackageManager';
import { PendingSpawnPromise } from '../utils/spawn';

export abstract class BasePackageManager implements PackageManager {
  readonly silent: boolean;
  readonly log?: (...args: any) => void;
  readonly options: PackageManagerOptions;

  // used for deferred adding of packages, e.g., when a package updates itself
  protected deferRun = false;
  protected deferredCommand: string | null = null;

  constructor({ silent, log, env = process.env, ...options }: PackageManagerOptions = {}) {
    this.silent = !!silent;
    this.log = log ?? (!silent ? console.log : undefined);
    this.options = {
      stdio: silent ? undefined : 'inherit',
      ...options,
      env: { ...this.getDefaultEnvironment(), ...env },
    };
  }

  /** Get the name of the package manager */
  abstract readonly name: string;
  /** Get the executable binary of the package manager */
  abstract readonly bin: string;
  /** Get the lockfile for this package manager */
  abstract readonly lockFile: string;

  /** Get the default environment variables used when running the package manager. */
  protected getDefaultEnvironment(): Record<string, string> {
    return {
      ADBLOCK: '1',
      DISABLE_OPENCOLLECTIVE: '1',
    };
  }

  abstract addAsync(
    namesOrFlags: string[]
  ): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
  abstract addDevAsync(
    namesOrFlags: string[]
  ): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
  abstract addGlobalAsync(
    namesOrFlags: string[]
  ): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;

  abstract removeAsync(
    namesOrFlags: string[]
  ): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
  abstract removeDevAsync(
    namesOrFlags: string[]
  ): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;
  abstract removeGlobalAsync(
    namesOrFlags: string[]
  ): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult>;

  abstract workspaceRoot(): PackageManager | null;

  /** Ensure the CWD is set to a non-empty string */
  protected ensureCwdDefined(method?: string): string {
    const cwd = this.options.cwd?.toString();
    const className = (this.constructor as typeof BasePackageManager).name;
    const methodName = method ? `.${method}` : '';
    assert(cwd, `cwd is required for ${className}${methodName}`);
    return cwd;
  }

  runAsync(command: string[]) {
    const namePlusCommand = `${this.name} ${command.join(' ')}`;
    this.log?.(`> ${namePlusCommand}`);
    if (this.deferRun) {
      this.deferredCommand = namePlusCommand;
      // no-op to get a SpawnResult to return
      return spawnAsync('echo', [''], { ...this.options, stdio: undefined });
    }
    return spawnAsync(this.bin, command, this.options);
  }

  async addDeferredAsync(namesOrFlags: string[]) {
    invariant(
      !this.deferRun,
      'addDeferredAsync cannot be called additional times while the first call is pending.'
    );
    this.deferRun = true;
    await this.addAsync(namesOrFlags);
    const myDeferredCommand = this.deferredCommand!;
    this.deferredCommand = null;
    this.deferRun = false;
    return myDeferredCommand;
  }

  async versionAsync() {
    return await this.runAsync(['--version']).then(({ stdout }) => stdout.trim());
  }

  async getConfigAsync(key: string) {
    return await this.runAsync(['config', 'get', key]).then(({ stdout }) => stdout.trim());
  }

  async removeLockfileAsync() {
    const cwd = this.ensureCwdDefined('removeLockFile');
    const filePath = path.join(cwd, this.lockFile);
    await fs.promises.rm(filePath, { force: true });
  }

  installAsync(flags: string[] = []): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult> {
    return this.runAsync(['install', ...flags]);
  }

  async uninstallAsync() {
    const cwd = this.ensureCwdDefined('uninstallAsync');
    const modulesPath = path.join(cwd, 'node_modules');
    await fs.promises.rm(modulesPath, { force: true, recursive: true });
  }
}
