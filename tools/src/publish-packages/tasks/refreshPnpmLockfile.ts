import { updateWorkspaceProjects } from './updateWorkspaceProjects';
import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { spawnAsync } from '../../Utils';
import { CommandOptions, Parcel, TaskArgs } from '../types';

/**
 * Refreshes `pnpm-lock.yaml` after the `package.json` bumps so that
 * `pnpm install --frozen-lockfile` on the publish commit doesn't fail.
 */
export const refreshPnpmLockfile = new Task<TaskArgs>(
  {
    name: 'refreshPnpmLockfile',
    dependsOn: [updateWorkspaceProjects],
    filesToStage: ['pnpm-lock.yaml'],
  },
  async (_parcels: Parcel[], options: CommandOptions) => {
    if (options.templatesOnly) {
      logger.info('\n🔒 Skipping lockfile refresh (templates-only).');
      return;
    }

    logger.info('\n🔒 Refreshing pnpm-lock.yaml...');

    await spawnAsync('pnpm', ['install', '--lockfile-only'], {
      cwd: EXPO_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        EXPO_NONINTERACTIVE: '1',
      },
    });
  }
);
