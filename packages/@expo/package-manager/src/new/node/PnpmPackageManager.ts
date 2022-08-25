import findWorkspaceDir from '@pnpm/find-workspace-dir';

import { BasePackageManager } from './BasePackageManager';

export class PnpmPackageManager extends BasePackageManager {
  readonly name = 'pnpm';
  readonly bin = 'pnpm';
  readonly lockFile = 'pnpm-lock.yaml';

  async workspaceRootAsync(): Promise<string | null> {
    const cwd = this.ensureCwdDefined('workspaceRootAsync');
    try {
      return (await findWorkspaceDir(cwd)) ?? null;
    } finally {
      return null;
    }
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

    return this.runAsync(['add', '--save-dev', ...namesOrFlags]);
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
    return this.runAsync(['remove', '--save-dev', ...namesOrFlags]);
  }

  removeGlobalAsync(namesOrFlags: string[]) {
    return this.runAsync(['remove', '--global', ...namesOrFlags]);
  }
}
