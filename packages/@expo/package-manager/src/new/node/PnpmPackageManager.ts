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

  async addAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    await this.runAsync(['add', ...namesOrFlags]);
  }

  async addDevAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    await this.runAsync(['add', '--save-dev', ...namesOrFlags]);
  }

  async addGlobalAsync(namesOrFlags: string[] = []) {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    await this.runAsync(['add', '--global', ...namesOrFlags]);
  }

  async removeAsync(namesOrFlags: string[]) {
    await this.runAsync(['remove', ...namesOrFlags]);
  }

  async removeDevAsync(namesOrFlags: string[]) {
    await this.runAsync(['remove', '--save-dev', ...namesOrFlags]);
  }

  async removeGlobalAsync(namesOrFlags: string[]) {
    await this.runAsync(['remove', '--global', ...namesOrFlags]);
  }
}
