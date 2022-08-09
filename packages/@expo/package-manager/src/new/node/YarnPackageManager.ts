import { isYarnOfflineAsync } from '../utils/yarn';
import { BasePackageManager } from './BasePackageManager';

export class YarnPackageManager extends BasePackageManager {
  readonly name = 'yarn';
  readonly bin = 'yarnpkg';
  readonly lockFile = 'yarn.lock';

  /** Check if Yarn is running in offline mode, and add the `--offline` flag */
  private async withOfflineFlagAsync(namesOrFlags: string[]): Promise<string[]> {
    return (await isYarnOfflineAsync()) ? [...namesOrFlags, '--offline'] : namesOrFlags;
  }

  async installAsync(flags: string[] = []): Promise<void> {
    const args = await this.withOfflineFlagAsync(['install']);
    await this.runAsync([...args, ...flags]);
  }

  async addAsync(namesOrFlags: string[] = []): Promise<void> {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    const args = await this.withOfflineFlagAsync(['add', ...namesOrFlags]);
    await this.runAsync(args);
  }

  async addDevAsync(namesOrFlags: string[] = []): Promise<void> {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    const args = await this.withOfflineFlagAsync(['add', '--dev', ...namesOrFlags]);
    await this.runAsync(args);
  }

  async addGlobalAsync(namesOrFlags: string[] = []): Promise<void> {
    if (!namesOrFlags.length) {
      return this.installAsync();
    }

    const args = await this.withOfflineFlagAsync(['global', 'add', ...namesOrFlags]);
    await this.runAsync(args);
  }

  async removeAsync(namesOrFlags: string[]): Promise<void> {
    await this.runAsync(['remove', ...namesOrFlags]);
  }

  async removeDevAsync(namesOrFlags: string[]): Promise<void> {
    await this.runAsync(['remove', ...namesOrFlags]);
  }

  async removeGlobalAsync(namesOrFlags: string[]): Promise<void> {
    await this.runAsync(['global', 'remove', ...namesOrFlags]);
  }
}
