import { BasePackageManager } from './BasePackageManager';
import env from '../utils/env';
import { findPnpmWorkspaceRoot, PNPM_LOCK_FILE } from '../utils/nodeWorkspaces';

export class PnpmPackageManager extends BasePackageManager {
  readonly name = 'pnpm';
  readonly bin = 'pnpm';
  readonly lockFile = PNPM_LOCK_FILE;

  workspaceRoot() {
    const root = findPnpmWorkspaceRoot(this.ensureCwdDefined('workspaceRoot'));
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

    return this.spawnAsync(['install', ...namesOrFlags]);
  }

  addAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.spawnAsync(['add', ...namesOrFlags]);
  }

  addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.spawnAsync(['add', '--save-dev', ...namesOrFlags]);
  }

  addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.spawnAsync(['add', '--global', ...namesOrFlags]);
  }

  removeAsync(namesOrFlags: string[]) {
    return this.spawnAsync(['remove', ...namesOrFlags]);
  }

  removeDevAsync(namesOrFlags: string[]) {
    return this.spawnAsync(['remove', '--save-dev', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.spawnAsync(['remove', '--global', ...namesOrFlags]);
  }
}
