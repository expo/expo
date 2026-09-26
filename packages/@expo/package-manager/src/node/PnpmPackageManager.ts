import env from '../utils/env';
import { resolveWorkspaceRoot, PNPM_LOCK_FILE } from '../utils/nodeManagers';
import { BasePackageManager } from './BasePackageManager';

// Resolve through pnpm's `minimumReleaseAge` gate (on by default since pnpm 11) - Expo installs pin known versions (#44479)
const MIN_RELEASE_AGE_OVERRIDE = '--config.minimumReleaseAge=0';

export class PnpmPackageManager extends BasePackageManager {
  readonly name = 'pnpm';
  readonly bin = 'pnpm';
  readonly lockFile = PNPM_LOCK_FILE;

  workspaceRoot() {
    const root = resolveWorkspaceRoot(this.ensureCwdDefined('workspaceRoot'));
    if (root) {
      return new PnpmPackageManager({
        ...this.options,
        silent: this.silent,
        log: this.log,
        cwd: root,
      });
    }

    return null;
  }

  installAsync(namesOrFlags: string[] = []) {
    if (env.CI && !namesOrFlags.join(' ').includes('frozen-lockfile')) {
      namesOrFlags.unshift('--no-frozen-lockfile');
    }

    return this.runAsync(['install', ...namesOrFlags, MIN_RELEASE_AGE_OVERRIDE]);
  }

  addAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.runAsync(['add', ...namesOrFlags, MIN_RELEASE_AGE_OVERRIDE]);
  }

  addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.runAsync(['add', '--save-dev', ...namesOrFlags, MIN_RELEASE_AGE_OVERRIDE]);
  }

  addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.runAsync(['add', '--global', ...namesOrFlags, MIN_RELEASE_AGE_OVERRIDE]);
  }

  removeAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', ...namesOrFlags]);
  }

  removeDevAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', '--save-dev', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', '--global', ...namesOrFlags]);
  }
}
