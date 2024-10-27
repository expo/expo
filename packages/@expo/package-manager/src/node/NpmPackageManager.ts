import JsonFile from '@expo/json-file';
import spawnAsync, { SpawnOptions } from '@expo/spawn-async';
import npmPackageArg from 'npm-package-arg';
import path from 'path';

import { BasePackageManager } from './BasePackageManager';
import { resolveWorkspaceRoot, NPM_LOCK_FILE } from '../utils/nodeManagers';
import { createPendingSpawnAsync } from '../utils/spawn';

export class NpmPackageManager extends BasePackageManager {
  readonly name = 'npm';
  readonly bin = 'npm';
  readonly lockFile = NPM_LOCK_FILE;

  workspaceRoot() {
    const root = resolveWorkspaceRoot(this.ensureCwdDefined('workspaceRoot'));
    if (root) {
      return new NpmPackageManager({
        ...this.options,
        silent: this.silent,
        log: this.log,
        cwd: root,
      });
    }

    return null;
  }

  addAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    const { flags, versioned, unversioned } = this.parsePackageSpecs(namesOrFlags);

    return createPendingSpawnAsync(
      () => this.updatePackageFileAsync(versioned, 'dependencies'),
      () =>
        !unversioned.length
          ? this.runAsync(['install', ...flags])
          : this.runAsync(['install', '--save', ...flags, ...unversioned.map((spec) => spec.raw)])
    );
  }

  addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    const { flags, versioned, unversioned } = this.parsePackageSpecs(namesOrFlags);

    return createPendingSpawnAsync(
      () => this.updatePackageFileAsync(versioned, 'devDependencies'),
      () =>
        !unversioned.length
          ? this.runAsync(['install', ...flags])
          : this.runAsync([
              'install',
              '--save-dev',
              ...flags,
              ...unversioned.map((spec) => spec.raw),
            ])
    );
  }

  addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.runAsync(['install', '--global', ...namesOrFlags]);
  }

  removeAsync(namesOrFlags: string[]) {
    return this.runAsync(['uninstall', ...namesOrFlags]);
  }

  removeDevAsync(namesOrFlags: string[]) {
    return this.runAsync(['uninstall', '--save-dev', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.runAsync(['uninstall', '--global', ...namesOrFlags]);
  }

  runBinAsync(command: string[], options: SpawnOptions = {}) {
    this.log?.(`> npx ${command.join(' ')}`);
    return spawnAsync('npx', command, { ...this.options, ...options });
  }

  /**
   * Parse all package specifications from the names or flag list.
   * The result from this method can be used for `.updatePackageFileAsync`.
   */
  private parsePackageSpecs(namesOrFlags: string[]) {
    const result: {
      flags: string[];
      versioned: npmPackageArg.Result[];
      unversioned: npmPackageArg.Result[];
    } = { flags: [], versioned: [], unversioned: [] };

    namesOrFlags
      .map((name) => {
        if (name.trim().startsWith('-')) {
          result.flags.push(name);
          return null;
        }

        return npmPackageArg(name);
      })
      .forEach((spec) => {
        // When using a dist-tag version of a library, we need to consider it as "unversioned".
        // Doing so will install that version with `npm install --save(-dev)`, and resolve the dist-tag properly.
        const hasExactSpec = !!spec && spec.rawSpec !== '' && spec.rawSpec !== '*';
        if (spec && hasExactSpec && spec.type !== 'tag') {
          result.versioned.push(spec);
        } else if (spec) {
          result.unversioned.push(spec);
        }
      });

    return result;
  }

  /**
   * Older npm versions have issues with mismatched nested dependencies when adding exact versions.
   * This propagates as issues like mismatched `@expo/config-pugins` versions.
   * As a workaround, we update the `package.json` directly and run `npm install`.
   */
  private async updatePackageFileAsync(
    packageSpecs: npmPackageArg.Result[],
    packageType: 'dependencies' | 'devDependencies'
  ) {
    if (!packageSpecs.length) {
      return;
    }

    const pkgPath = path.join(this.options.cwd?.toString() || '.', 'package.json');
    const pkg =
      await JsonFile.readAsync<Record<typeof packageType, { [pkgName: string]: string }>>(pkgPath);

    packageSpecs.forEach((spec) => {
      pkg[packageType] = pkg[packageType] || {};
      pkg[packageType][spec.name!] = spec.rawSpec;
    });

    await JsonFile.writeAsync(pkgPath, pkg, { json5: false });
  }
}
