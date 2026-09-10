import JsonFile from '@expo/json-file';
import type { SpawnOptions } from '@expo/spawn-async';
import spawnAsync from '@expo/spawn-async';
import npmPackageArg from 'npm-package-arg';
import path from 'path';

import { resolveWorkspaceRoot, NPM_LOCK_FILE } from '../utils/nodeManagers';
import { createPendingSpawnAsync } from '../utils/spawn';
import { BasePackageManager } from './BasePackageManager';

export class NpmPackageManager extends BasePackageManager {
  readonly name = 'npm';
  readonly bin = 'npm';
  readonly lockFile = NPM_LOCK_FILE;

  private npmVersionPromise?: Promise<string>;

  /**
   * Resolve through npm's `min-release-age` gate - Expo installs pin known versions (#44479).
   * npm 11.0-11.9 warns about the unknown env config on every command, so only set it when
   * npm >=11.10 understands the setting.
   */
  private async withMinReleaseAgeEnvAsync(): Promise<NodeJS.ProcessEnv> {
    try {
      this.npmVersionPromise ??= this.versionAsync();
      const [major = 0, minor = 0] = (await this.npmVersionPromise).split('.').map(Number);
      if (major > 11 || (major === 11 && minor >= 10)) {
        return { npm_config_min_release_age: '0', ...this.options.env };
      }
    } catch {
      // Run without the override and let the install itself surface any real error
    }
    return this.options.env ?? {};
  }

  installAsync(flags: string[] = []) {
    return createPendingSpawnAsync(
      () => this.withMinReleaseAgeEnvAsync(),
      (env) => this.runAsync(['install', ...flags], { env })
    );
  }

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
      async () => {
        await this.updatePackageFileAsync(versioned, 'dependencies');
        return this.withMinReleaseAgeEnvAsync();
      },
      (env) =>
        !unversioned.length
          ? this.runAsync(['install', ...flags], { env })
          : this.runAsync(['install', '--save', ...flags, ...unversioned.map((spec) => spec.raw)], {
              env,
            })
    );
  }

  addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    const { flags, versioned, unversioned } = this.parsePackageSpecs(namesOrFlags);

    return createPendingSpawnAsync(
      async () => {
        await this.updatePackageFileAsync(versioned, 'devDependencies');
        return this.withMinReleaseAgeEnvAsync();
      },
      (env) =>
        !unversioned.length
          ? this.runAsync(['install', ...flags], { env })
          : this.runAsync(
              ['install', '--save-dev', ...flags, ...unversioned.map((spec) => spec.raw)],
              { env }
            )
    );
  }

  addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return createPendingSpawnAsync(
      () => this.withMinReleaseAgeEnvAsync(),
      (env) => this.runAsync(['install', '--global', ...namesOrFlags], { env })
    );
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

  /** Sort dependencies by keys (case-insensitive, stable). Sorting algorithm is taken from https://github.com/npm/package-json/blob/f5db81bdfbba5e9d3bfc0732f8bfe511825a20aa/lib/update-dependencies.js#L9 */
  private orderDependencies(deps: Record<string, string> | undefined): Record<string, string> {
    if (!deps) {
      return {};
    }

    const sorted = Object.keys(deps)
      .sort((a, b) => a.localeCompare(b, 'en'))
      .reduce(
        (res, key) => {
          const dep = deps[key];
          if (dep != null) {
            res[key] = dep;
          }
          return res;
        },
        {} as Record<string, string>
      );

    return sorted;
  }

  /**
   * Older npm versions have issues with mismatched nested dependencies when adding exact versions.
   * This propagates as issues like mismatched `@expo/config-plugins` versions.
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

    pkg[packageType] = this.orderDependencies(pkg[packageType]);

    await JsonFile.writeAsync(pkgPath, pkg, { json5: false });
  }
}
