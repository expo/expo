import spawnAsync, { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import assert from 'assert';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

import { PackageManager, PackageManagerOptions } from '../PackageManager';
import { PendingSpawnPromise } from '../utils/spawn';

export abstract class BasePackageManager implements PackageManager {
  readonly silent: boolean;
  readonly logger: (...args: any) => void;
  readonly options: PackageManagerOptions;

  constructor({ silent, logger, ...options }: PackageManagerOptions = {}) {
    this.silent = !!silent;
    this.logger = logger || console.log;
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

  /** Ensure the CWD is set to a non-empty string */
  protected ensureCwdDefined(method?: string): string {
    const cwd = this.options.cwd?.toString();
    const className = (this.constructor as typeof BasePackageManager).name;
    const methodName = method ? `.${method}` : '';
    assert(cwd, `cwd is required for ${className}${methodName}`);
    return cwd;
  }

  runAsync(command: string[]) {
    if (!this.silent && !this.options.ignoreStdio) {
      this.logger?.(`> ${this.name} ${command.join(' ')}`);
    }

    return spawnAsync(this.bin, command, this.options);
  }

  async versionAsync() {
    return await this.runAsync(['--version']).then(({ stdout }) => stdout.trim());
  }

  async configAsync(key: string) {
    return await this.runAsync(['config', 'get', key]).then(({ stdout }) => stdout.trim());
  }

  async workspaceRootAsync() {
    const cwd = this.ensureCwdDefined('workspaceRootAsync');
    try {
      return findWorkspaceRoot(path.resolve(cwd)) ?? null;
    } finally {
      return null;
    }
  }

  async removeLockFileAsync() {
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
