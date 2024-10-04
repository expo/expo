import { BasePackageManager } from './BasePackageManager';
import { resolveWorkspaceRoot, YARN_LOCK_FILE } from '../utils/nodeManagers';
import { createPendingSpawnAsync } from '../utils/spawn';
import { isYarnOfflineAsync } from '../utils/yarn';

export class YarnPackageManager extends BasePackageManager {
  readonly name = 'yarn';
  readonly bin = 'yarnpkg';
  readonly lockFile = YARN_LOCK_FILE;

  /** Check if Yarn is running in offline mode, and add the `--offline` flag */
  private async withOfflineFlagAsync(namesOrFlags: string[]): Promise<string[]> {
    return (await isYarnOfflineAsync()) ? [...namesOrFlags, '--offline'] : namesOrFlags;
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
      () => this.withOfflineFlagAsync(['install']),
      (args) => this.runAsync([...args, ...flags])
    );
  }

  addAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return createPendingSpawnAsync(
      () => this.withOfflineFlagAsync(['add', ...namesOrFlags]),
      (args) => this.runAsync(args)
    );
  }

  addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return createPendingSpawnAsync(
      () => this.withOfflineFlagAsync(['add', '--dev', ...namesOrFlags]),
      (args) => this.runAsync(args)
    );
  }

  addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return createPendingSpawnAsync(
      () => this.withOfflineFlagAsync(['global', 'add', ...namesOrFlags]),
      (args) => this.runAsync(args)
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
