import JsonFile from '@expo/json-file';
import spawnAsync, { SpawnOptions } from '@expo/spawn-async';
import ansiRegex from 'ansi-regex';
import { existsSync } from 'fs';
import npmPackageArg from 'npm-package-arg';
import path from 'path';
import rimraf from 'rimraf';
import split from 'split';
import { Transform } from 'stream';

import { Logger, PackageManager } from './PackageManager';
import { PnpmPackageManager } from './PnpmPackageManager';
import isYarnOfflineAsync from './utils/isYarnOfflineAsync';
import { findWorkspaceRoot, isUsingYarn, resolvePackageManager } from './utils/nodeWorkspaces';

export type NodePackageManager = 'yarn' | 'npm' | 'pnpm';

/**
 * Disable various postinstall scripts
 * - https://github.com/opencollective/opencollective-postinstall/pull/9
 */
export const DISABLE_ADS_ENV = { DISABLE_OPENCOLLECTIVE: '1', ADBLOCK: '1' };

const ansi = `(?:${ansiRegex().source})*`;
const npmPeerDependencyWarningPattern = new RegExp(
  `${ansi}npm${ansi} ${ansi}WARN${ansi}.+You must install peer dependencies yourself\\.\n`,
  'g'
);
const yarnPeerDependencyWarningPattern = new RegExp(
  `${ansi}warning${ansi} "[^"]+" has (?:unmet|incorrect) peer dependency "[^"]+"\\.\n`,
  'g'
);

class NpmStderrTransform extends Transform {
  _transform(
    chunk: Buffer,
    encoding: string,
    callback: (error?: Error | null, data?: any) => void
  ) {
    this.push(chunk.toString().replace(npmPeerDependencyWarningPattern, ''));
    callback();
  }
}

class YarnStderrTransform extends Transform {
  _transform(
    chunk: Buffer,
    encoding: string,
    callback: (error?: Error | null, data?: any) => void
  ) {
    this.push(chunk.toString().replace(yarnPeerDependencyWarningPattern, ''));
    callback();
  }
}

export class NpmPackageManager implements PackageManager {
  options: SpawnOptions;

  private log: Logger;

  constructor({ cwd, log, silent }: { cwd: string; log?: Logger; silent?: boolean }) {
    this.log = log || console.log;
    this.options = {
      env: {
        ...process.env,
        ...DISABLE_ADS_ENV,
      },
      cwd,
      ...(silent
        ? { ignoreStdio: true }
        : {
            stdio: ['inherit', 'inherit', 'pipe'],
          }),
    };
  }

  get name() {
    return 'npm';
  }

  async installAsync(parameters: string[] = []) {
    await this._runAsync(['install', ...parameters]);
  }

  async addGlobalAsync(...names: string[]) {
    if (!names.length) return this.installAsync();
    await this._runAsync(['install', '--global', ...names]);
  }

  async addWithParametersAsync(names: string[], parameters: string[] = []) {
    if (!names.length) return this.installAsync(parameters);

    const { versioned, unversioned } = this._parseSpecs(names);
    if (versioned.length) {
      await this._patchAsync(versioned, 'dependencies');
      await this.installAsync(parameters);
    }
    if (unversioned.length) {
      await this._runAsync([
        'install',
        '--save',
        ...unversioned.map(spec => spec.raw),
        ...parameters,
      ]);
    }
  }

  async addAsync(...names: string[]) {
    await this.addWithParametersAsync(names, []);
  }

  async addDevAsync(...names: string[]) {
    if (!names.length) return this.installAsync();

    const { versioned, unversioned } = this._parseSpecs(names);
    if (versioned.length) {
      await this._patchAsync(versioned, 'devDependencies');
      await this._runAsync(['install']);
    }
    if (unversioned.length) {
      await this._runAsync(['install', '--save-dev', ...unversioned.map(spec => spec.raw)]);
    }
  }

  async removeAsync(...names: string[]) {
    await this._runAsync(['uninstall', ...names]);
  }

  async versionAsync() {
    const { stdout } = await spawnAsync('npm', ['--version'], { stdio: 'pipe' });
    return stdout.trim();
  }

  async getConfigAsync(key: string) {
    const { stdout } = await spawnAsync('npm', ['config', 'get', key], { stdio: 'pipe' });
    return stdout.trim();
  }

  async removeLockfileAsync() {
    if (!this.options.cwd) {
      throw new Error('cwd required for NpmPackageManager.removeLockfileAsync');
    }
    const lockfilePath = path.join(this.options.cwd, 'package-lock.json');
    if (existsSync(lockfilePath)) {
      rimraf.sync(lockfilePath);
    }
  }

  async cleanAsync() {
    if (!this.options.cwd) {
      throw new Error('cwd required for NpmPackageManager.cleanAsync');
    }
    const nodeModulesPath = path.join(this.options.cwd, 'node_modules');
    if (existsSync(nodeModulesPath)) {
      rimraf.sync(nodeModulesPath);
    }
  }

  // Private
  private async _runAsync(args: string[]) {
    if (!this.options.ignoreStdio) {
      this.log(`> npm ${args.join(' ')}`);
    }

    // Have spawnAsync consume stdio but we don't actually do anything with it if it's ignored
    const promise = spawnAsync('npm', [...args], { ...this.options, ignoreStdio: false });
    if (promise.child.stderr && !this.options.ignoreStdio) {
      promise.child.stderr
        .pipe(split(/\r?\n/, (line: string) => line + '\n'))
        .pipe(new NpmStderrTransform())
        .pipe(process.stderr);
    }
    return promise;
  }

  private _parseSpecs(names: string[]) {
    const result: {
      versioned: npmPackageArg.Result[];
      unversioned: npmPackageArg.Result[];
    } = { versioned: [], unversioned: [] };
    names
      .map(name => npmPackageArg(name))
      .forEach(spec => {
        if (spec.rawSpec) {
          result.versioned.push(spec);
        } else {
          result.unversioned.push(spec);
        }
      });
    return result;
  }

  private async _patchAsync(
    specs: npmPackageArg.Result[],
    packageType: 'dependencies' | 'devDependencies'
  ) {
    const pkgPath = path.join(this.options.cwd || '.', 'package.json');
    const pkg = await JsonFile.readAsync(pkgPath);
    specs.forEach(spec => {
      pkg[packageType] = pkg[packageType] || {};
      // @ts-ignore
      pkg[packageType][spec.name!] = spec.rawSpec;
    });
    await JsonFile.writeAsync(pkgPath, pkg, { json5: false });
  }
}

export class YarnPackageManager implements PackageManager {
  options: SpawnOptions;
  private log: Logger;

  constructor({ cwd, log, silent }: { cwd: string; log?: Logger; silent?: boolean }) {
    this.log = log || console.log;
    this.options = {
      env: {
        ...process.env,
        ...DISABLE_ADS_ENV,
      },
      cwd,
      ...(silent
        ? { ignoreStdio: true }
        : {
            stdio: ['inherit', 'inherit', 'pipe'],
          }),
    };
  }

  get name() {
    return 'Yarn';
  }

  private async withOfflineSupportAsync(...args: string[]): Promise<string[]> {
    if (await isYarnOfflineAsync()) {
      args.push('--offline');
    }
    // TODO: Maybe prompt about being offline and using local yarn cache.
    return args;
  }

  async installAsync() {
    const args = await this.withOfflineSupportAsync('install');
    await this._runAsync(args);
  }

  async addGlobalAsync(...names: string[]) {
    if (!names.length) return this.installAsync();
    const args = await this.withOfflineSupportAsync('global', 'add');
    args.push(...names);

    await this._runAsync(args);
  }

  async addWithParametersAsync(names: string[], parameters: string[] = []) {
    if (!names.length) return this.installAsync();
    const args = await this.withOfflineSupportAsync('add');
    args.push(...names);
    args.push(...parameters);

    await this._runAsync(args);
  }

  async addAsync(...names: string[]) {
    await this.addWithParametersAsync(names, []);
  }

  async addDevAsync(...names: string[]) {
    if (!names.length) return this.installAsync();
    const args = await this.withOfflineSupportAsync('add', '--dev');
    args.push(...names);
    await this._runAsync(args);
  }

  async removeAsync(...names: string[]) {
    await this._runAsync(['remove', ...names]);
  }

  async versionAsync() {
    const { stdout } = await spawnAsync('yarnpkg', ['--version'], { stdio: 'pipe' });
    return stdout.trim();
  }

  async getConfigAsync(key: string) {
    const { stdout } = await spawnAsync('yarnpkg', ['config', 'get', key], { stdio: 'pipe' });
    return stdout.trim();
  }

  async removeLockfileAsync() {
    if (!this.options.cwd) {
      throw new Error('cwd required for YarnPackageManager.removeLockfileAsync');
    }
    const lockfilePath = path.join(this.options.cwd, 'yarn-lock.json');
    if (existsSync(lockfilePath)) {
      rimraf.sync(lockfilePath);
    }
  }

  async cleanAsync() {
    if (!this.options.cwd) {
      throw new Error('cwd required for YarnPackageManager.cleanAsync');
    }
    const nodeModulesPath = path.join(this.options.cwd, 'node_modules');
    if (existsSync(nodeModulesPath)) {
      rimraf.sync(nodeModulesPath);
    }
  }

  // Private
  private async _runAsync(args: string[]) {
    if (!this.options.ignoreStdio) {
      this.log(`> yarn ${args.join(' ')}`);
    }

    // Have spawnAsync consume stdio but we don't actually do anything with it if it's ignored
    const promise = spawnAsync('yarnpkg', args, { ...this.options, ignoreStdio: false });
    if (promise.child.stderr && !this.options.ignoreStdio) {
      promise.child.stderr.pipe(new YarnStderrTransform()).pipe(process.stderr);
    }
    return promise;
  }
}

export type CreateForProjectOptions = Partial<Record<NodePackageManager, boolean>> & {
  log?: Logger;
  silent?: boolean;
};

export function createForProject(
  projectRoot: string,
  options: CreateForProjectOptions = {}
): NpmPackageManager | YarnPackageManager | PnpmPackageManager {
  let PackageManager;
  if (options.npm) {
    PackageManager = NpmPackageManager;
  } else if (options.yarn) {
    PackageManager = YarnPackageManager;
  } else if (options.pnpm) {
    PackageManager = PnpmPackageManager;
  } else if (isUsingYarn(projectRoot)) {
    PackageManager = YarnPackageManager;
  } else if (resolvePackageManager(projectRoot, 'pnpm')) {
    PackageManager = PnpmPackageManager;
  } else {
    PackageManager = NpmPackageManager;
  }

  return new PackageManager({ cwd: projectRoot, log: options.log, silent: options.silent });
}

export function getModulesPath(projectRoot: string): string {
  const workspaceRoot = findWorkspaceRoot(path.resolve(projectRoot)); // Absolute path or null
  if (workspaceRoot) {
    return path.resolve(workspaceRoot, 'node_modules');
  }

  return path.resolve(projectRoot, 'node_modules');
}
