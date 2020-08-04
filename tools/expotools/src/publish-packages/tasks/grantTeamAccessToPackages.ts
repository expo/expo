import chalk from 'chalk';

import logger from '../../Logger';
import * as Npm from '../../Npm';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { prepareParcels } from './prepareParcels';

const { green } = chalk;

/**
 * Grants package access to the whole team. Applies only when the package
 * wasn't published before or someone from the team is not included in maintainers list.
 */
export const grantTeamAccessToPackages = new Task<TaskArgs>(
  {
    name: 'grantTeamAccessToPackages',
    dependsOn: [prepareParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    // There is no good way to check whether the package is added to organization team,
    // so let's get all team members and check if they all are declared as maintainers.
    // If they don't, grant access for the team.
    const teamMembers = await Npm.getTeamMembersAsync(Npm.EXPO_DEVELOPERS_TEAM_NAME);
    const packagesToGrantAccess = parcels.filter(
      ({ pkgView, state }) =>
        (pkgView || state.published) && doesSomeoneHaveNoAccessToPackage(teamMembers, pkgView)
    );

    if (packagesToGrantAccess.length === 0) {
      logger.success('\n🎖  Granting team access not required.');
      return;
    }

    if (!options.dry) {
      logger.info('\n🎖  Granting team access...');

      for (const { pkg } of packagesToGrantAccess) {
        logger.log('  ', green(pkg.packageName));
        await Npm.grantReadWriteAccessAsync(pkg.packageName, Npm.EXPO_DEVELOPERS_TEAM_NAME);
      }
    } else {
      logger.info(
        '\n🎖  Team access would be granted to',
        packagesToGrantAccess.map(({ pkg }) => green(pkg.packageName)).join(', ')
      );
    }
  }
);

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
  return users.every((user) => maintainers.includes(user));
}
