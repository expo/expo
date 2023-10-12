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

  runAsync(scriptName: string, argsOrFlags: string[] = []) {
    return this.executeAsync(['run', scriptName, ...argsOrFlags]);
  }

  installAsync(namesOrFlags: string[] = []) {
    return this.executeAsync(['install', ...namesOrFlags]);
  }

  addAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.executeAsync(['add', ...namesOrFlags]);
  }

  addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.executeAsync(['add', '--dev', ...namesOrFlags]);
  }

  addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    return this.executeAsync(['add', '--global', ...namesOrFlags]);
  }

  removeAsync(namesOrFlags: string[]) {
    return this.executeAsync(['remove', ...namesOrFlags]);
  }

  removeDevAsync(namesOrFlags: string[]) {
    return this.executeAsync(['remove', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.executeAsync(['remove', '--global', ...namesOrFlags]);
  }
}
