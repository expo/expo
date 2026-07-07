import { resolveWorkspaceRoot, DENO_LOCK_FILE } from '../utils/nodeManagers';
import { BasePackageManager } from './BasePackageManager';

export class DenoPackageManager extends BasePackageManager {
  readonly name = 'deno';
  readonly bin = 'deno';
  readonly lockFile = DENO_LOCK_FILE;

  workspaceRoot() {
    const root = resolveWorkspaceRoot(this.ensureCwdDefined('workspaceRoot'));
    if (root) {
      return new DenoPackageManager({
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

    // `deno install --global` expects module specifiers — bare npm package
    // names must be prefixed with `npm:` (unlike `deno add`, which defaults
    // to the npm registry).
    return this.runAsync([
      'install',
      '--global',
      ...namesOrFlags.map((nameOrFlag) =>
        nameOrFlag.startsWith('-') || nameOrFlag.includes(':') ? nameOrFlag : `npm:${nameOrFlag}`
      ),
    ]);
  }

  removeAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', ...namesOrFlags]);
  }

  removeDevAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.runAsync(['uninstall', '--global', ...namesOrFlags]);
  }
}
