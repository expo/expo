import { resolveWorkspaceRoot, YARN_LOCK_FILE } from '../utils/nodeManagers';
import { createPendingSpawnAsync } from '../utils/spawn';
import { isYarnOfflineAsync } from '../utils/yarn';
import { BasePackageManager } from './BasePackageManager';

export class YarnPackageManager extends BasePackageManager {
  readonly name = 'yarn';
  readonly bin = 'yarnpkg';
  readonly lockFile = YARN_LOCK_FILE;

  private yarnVersionPromise?: Promise<string>;

  /** Check if Yarn is running in offline mode, and add the `--offline` flag */
  private async withOfflineFlagAsync(namesOrFlags: string[]): Promise<string[]> {
    return (await isYarnOfflineAsync()) ? [...namesOrFlags, '--offline'] : namesOrFlags;
  }

  /**
   * Resolve through Yarn's `npmMinimalAgeGate` quarantine (on by default since Yarn 4.15) -
   * Expo installs pin known versions (#44479). Yarn <4.10 exits with a usage error when this
   * setting is present in the environment, so only set it when the version supports it.
   */
  private async withDisabledAgeGateEnvAsync(): Promise<NodeJS.ProcessEnv> {
    try {
      this.yarnVersionPromise ??= this.versionAsync();
      const [major = 0, minor = 0] = (await this.yarnVersionPromise).split('.').map(Number);
      if (major > 4 || (major === 4 && minor >= 10)) {
        return { YARN_NPM_MINIMAL_AGE_GATE: '0', ...this.options.env };
      }
    } catch {
      // Run without the override and let the install itself surface any real error
    }
    return this.options.env ?? {};
  }

  workspaceRoot() {
    const root = resolveWorkspaceRoot(this.ensureCwdDefined('workspaceRoot'));
    if (root) {
      return new YarnPackageManager({
        ...this.options,
        silent: this.silent,
        log: this.log,
        cwd: root,
      });
    }

    return null;
  }

  installAsync(flags: string[] = []) {
    return createPendingSpawnAsync(
      async () => ({
        args: await this.withOfflineFlagAsync(['install']),
        env: await this.withDisabledAgeGateEnvAsync(),
      }),
      ({ args, env }) => this.runAsync([...args, ...flags], { env })
    );
  }

  addAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return createPendingSpawnAsync(
      async () => ({
        args: await this.withOfflineFlagAsync(['add', ...namesOrFlags]),
        env: await this.withDisabledAgeGateEnvAsync(),
      }),
      ({ args, env }) => this.runAsync(args, { env })
    );
  }

  addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return createPendingSpawnAsync(
      async () => ({
        args: await this.withOfflineFlagAsync(['add', '--dev', ...namesOrFlags]),
        env: await this.withDisabledAgeGateEnvAsync(),
      }),
      ({ args, env }) => this.runAsync(args, { env })
    );
  }

  addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return createPendingSpawnAsync(
      async () => ({
        args: await this.withOfflineFlagAsync(['global', 'add', ...namesOrFlags]),
        env: await this.withDisabledAgeGateEnvAsync(),
      }),
      ({ args, env }) => this.runAsync(args, { env })
    );
  }

  removeAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', ...namesOrFlags]);
  }

  removeDevAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.runAsync(['global', 'remove', ...namesOrFlags]);
  }
}
