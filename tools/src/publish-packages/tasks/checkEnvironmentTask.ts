import chalk from 'chalk';

import logger from '../../Logger';
import * as Npm from '../../Npm';
import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';

const { cyan } = chalk;

/**
 * Checks whether the environment allows to proceed with any further tasks.
 */
export const checkEnvironmentTask = new Task<TaskArgs>(
  {
    name: 'checkEnvironmentTask',
    required: true,
  },
  async (): Promise<void | symbol> => {
    const npmUser = await Npm.whoamiAsync();

    if (!npmUser) {
      logger.error(
        '❗️ You must be logged in to NPM to publish packages, please run `npm login` first'
      );
      return Task.STOP;
    }

    const teamMembers = await Npm.getTeamMembersAsync(Npm.EXPO_DEVELOPERS_TEAM_NAME);

    if (!teamMembers.includes(npmUser)) {
      logger.error(
        `❗️ You must be in ${cyan(Npm.EXPO_DEVELOPERS_TEAM_NAME)} team to publish packages`
      );
      return Task.STOP;
    }
  }
);
