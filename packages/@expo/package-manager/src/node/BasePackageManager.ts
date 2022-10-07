import spawnAsync, { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

import { PackageManager, PackageManagerOptions } from '../PackageManager';
import { PendingSpawnPromise } from '../utils/spawn';

export abstract class BasePackageManager implements PackageManager {
  readonly silent: boolean;
  readonly log?: (...args: any) => void;
  readonly options: PackageManagerOptions;

  constructor({ silent, log, ...options }: PackageManagerOptions = {}) {
    this.silent = !!silent;
    this.log = log ?? (!silent ? console.log : undefined);
    this.options = options;
  }

  /** Get the name of the package manager */
  abstract readonly name: string;
  /** Get the executable binary of the package manager */
  abstract readonly bin: string;
  /** Get the lockfile for this package manager */
  abstract readonly lockFile: string;

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
    this.log?.(`> ${this.name} ${command.join(' ')}`);
    const spawn = spawnAsync(this.bin, command, this.options);

    if (!this.silent) {
      spawn.child.stderr?.pipe(process.stderr);
    }

    return spawn;
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
    if (fs.existsSync(filePath)) {
      rimraf.sync(filePath);
    }
  }

  installAsync(flags: string[] = []): SpawnPromise<SpawnResult> | PendingSpawnPromise<SpawnResult> {
    return this.runAsync(['install', ...flags]);
  }

  async uninstallAsync() {
    const cwd = this.ensureCwdDefined('uninstallAsync');
    const modulesPath = path.join(cwd, 'node_modules');
    if (fs.existsSync(modulesPath)) {
      rimraf.sync(modulesPath);
    }
  }
}
