import { styleText } from 'node:util';

import * as Npm from '../../Npm';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

/**
 * Checks whether the environment allows to proceed with any further tasks.
 */
export const checkEnvironmentTask = new Task<TaskArgs>(
  {
    name: 'checkEnvironmentTask',
    required: true,
  },
  async (_parcels: Parcel[], options: CommandOptions): Promise<void | symbol> => {
    // A dry run doesn't publish anything, so it doesn't require NPM auth. Skip
    // the login check so dry runs work without a token (e.g. on Dependabot
    // pull requests and forks, which don't have access to repository secrets).
    if (options.dry) {
      return;
    }

    const npmUser = await Npm.whoamiAsync();

    if (!npmUser) {
      throw new Error(
        '❗️ You must be logged in to NPM to publish packages, please run `npm login` first'
      );
    }

    // `npm team ls` command fails on the access token that we use on the CI.
    // We're actually sure that expo-bot account is in the team, so we can skip this check.
    if (process.env.CI && npmUser === Npm.EXPO_BOT_ACCOUNT_NAME) {
      return;
    }
    const teamMembers = await Npm.getTeamMembersAsync(Npm.EXPO_DEVELOPERS_TEAM_NAME);

    if (!teamMembers.includes(npmUser)) {
      throw new Error(
        `❗️ You must be in ${styleText('cyan', Npm.EXPO_DEVELOPERS_TEAM_NAME)} team to publish packages`
      );
    }
  }
);
