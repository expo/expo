import chalk from 'chalk';

import { loadRequestedParcels } from './loadRequestedParcels';
import logger from '../../Logger';
import * as Npm from '../../Npm';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green } = chalk;

/**
 * Grants package access to the whole team. Applies only when the package
 * wasn't published before or someone from the team is not included in maintainers list.
 */
export const grantTeamAccessToPackages = new Task<TaskArgs>(
  {
    name: 'grantTeamAccessToPackages',
    dependsOn: [loadRequestedParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    // There is no good way to check whether the package is added to organization team,
    // so let's get all team members and check if they all are declared as maintainers.
    // If they don't, grant access for the team.
    const teamMembers = await Npm.getTeamMembersAsync(Npm.EXPO_DEVELOPERS_TEAM_NAME);
    const packagesToGrantAccess = parcels
      .filter(filterPackagesToGrantAccess(teamMembers))
      .map(({ pkg }) => pkg.packageName);

    if (packagesToGrantAccess.length === 0) {
      logger.success('\n🎖  Granting team access not required.');
      return;
    }

    logger.info(
      `\n🎖  ${options.dry ? 'Team access would be granted to' : 'Granting team access to'}`,
      packagesToGrantAccess.map((name) => green(name)).join(' ')
    );

    if (!options.dry) {
      for (const packageName of packagesToGrantAccess) {
        try {
          await Npm.grantReadWriteAccessAsync(packageName, Npm.EXPO_DEVELOPERS_TEAM_NAME);
        } catch (e) {
          logger.debug(e.stderr || e.stdout);
          logger.error(`🎖  Granting access to ${green(packageName)} failed`);
        }
      }
    }
  }
);

/**
 * Returns filter function that when called returns a boolean whether to grant access or not.
 */
function filterPackagesToGrantAccess(teamMembers: string[]) {
  return ({ pkgView, state }) =>
    (pkgView || state.published) && doesSomeoneHaveNoAccessToPackage(teamMembers, pkgView);
}

/**
 * Returns boolean value determining if someone from given users list is not a maintainer of the package.
 */
function doesSomeoneHaveNoAccessToPackage(
  users: string[],
  pkgView?: Npm.PackageViewType | null
): boolean {
  if (!pkgView) {
    return true;
  }
  // Maintainers array has items of shape: "username <user@domain.com>" so we strip everything after whitespace.
  const maintainers = pkgView.maintainers.map((maintainer) =>
    maintainer.replace(/^(.+)\s.*$/, '$1')
  );
  return users.some((user) => !maintainers.includes(user));
}
