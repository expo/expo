import { BasePackageManager } from './BasePackageManager';
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

    return this.spawnAsync(['add', '--dev', ...namesOrFlags]);
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
    return this.spawnAsync(['remove', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.spawnAsync(['remove', '--global', ...namesOrFlags]);
  }
}
