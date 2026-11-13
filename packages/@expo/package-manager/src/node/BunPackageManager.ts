import fs from 'fs';
import path from 'path';

import { resolveWorkspaceRoot, BUN_LOCK_FILE, BUN_TEXT_LOCK_FILE } from '../utils/nodeManagers';
import { BasePackageManager } from './BasePackageManager';

// Resolve through Bun's `install.minimumReleaseAge` gate (Bun >=1.3) - Expo installs pin known versions (#44479).
// Keep the `=` form: Bun <=1.2 would treat a separate `0` argument as a package name.
const MIN_RELEASE_AGE_OVERRIDE = '--minimum-release-age=0';

export class BunPackageManager extends BasePackageManager {
  readonly name = 'bun';
  readonly bin = 'bun';
  get lockFile() {
    const cwd = this.options.cwd?.toString() || process.cwd();
    return fs.existsSync(path.join(cwd, BUN_LOCK_FILE)) ? BUN_LOCK_FILE : BUN_TEXT_LOCK_FILE;
  }

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

    return this.runAsync(['add', '--dev', ...namesOrFlags, MIN_RELEASE_AGE_OVERRIDE]);
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
    return this.runAsync(['remove', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', '--global', ...namesOrFlags]);
  }
}
