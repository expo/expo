import { BasePackageManager } from './BasePackageManager';
import { resolveWorkspaceRoot, BUN_LOCK_FILE } from '../utils/nodeManagers';

export class BunPackageManager extends BasePackageManager {
  readonly name = 'bun';
  readonly bin = 'bun';
  readonly lockFile = BUN_LOCK_FILE;

  workspaceRoot() {
    const root = resolveWorkspaceRoot(this.ensureCwdDefined('workspaceRoot'));
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
    return this.runAsync(['remove', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', '--global', ...namesOrFlags]);
  }
}
