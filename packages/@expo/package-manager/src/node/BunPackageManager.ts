import { BasePackageManager } from './BasePackageManager';
import env from '../utils/env';
import { findYarnOrNpmWorkspaceRoot, BUN_LOCK_FILE } from '../utils/nodeWorkspaces';

export class BunPackageManager extends BasePackageManager {
  readonly name = 'bun';
  readonly bin = 'bun';
  readonly lockFile = BUN_LOCK_FILE;

  workspaceRoot() {
    const root = findYarnOrNpmWorkspaceRoot(this.ensureCwdDefined('workspaceRoot'));
    if (root) {
      return new BunPackageManager({
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
      // Remove --frozen-lockfile if it's already set
      namesOrFlags = namesOrFlags.filter((flag) => flag !== '--frozen-lockfile');
    }

    return this.runAsync(['install', ...namesOrFlags]);
  }

  addAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.runAsync(['add', ...namesOrFlags]);
  }

  addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.runAsync(['add', '--dev', ...namesOrFlags]);
  }

  addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.runAsync(['add', '--global', ...namesOrFlags]);
  }

  removeAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', ...namesOrFlags]);
  }

  removeDevAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', '--dev', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', '--global', ...namesOrFlags]);
  }
}
