import chalk from 'chalk';

import { Actor, getActorDisplayName, getUserAsync } from '../api/user/user';
import { Role } from '../graphql/generated';
import * as Log from '../log';

export async function whoamiAsync() {
  const actor = await getUserAsync();

  if (actor) {
    Log.log(chalk.green(getActorDisplayName(actor)));

    // personal account is included, only show if more accounts that personal account
    // but do show personal account in list if there are more
    const accountExcludingPersonalAccount = actor.accounts.filter(
      (account) => !('username' in actor) || account.name !== actor.username
    );
    if (accountExcludingPersonalAccount.length > 0) {
      Log.log();
      Log.log('Accounts:');
      actor.accounts.forEach((account) => {
        const roleOnAccount = getRoleOnAccount({ actor, account });
        Log.log(`• ${account.name} (Role: ${getLabelForRole(roleOnAccount)})`);
      });
    }
    process.exit(0);
  } else {
    Log.exit('Not logged in');
  }
}

function getRoleOnAccount({
  actor,
  account,
}: {
  actor: Actor;
  account: Actor['accounts'][number];
}) {
  if ('username' in actor && account.name === actor.username) {
    return Role.Owner;
  }

  return account.users.find((user) => user.actor.id === actor.id)?.role!;
}

function getLabelForRole(role: Role): string {
  switch (role) {
    case Role.Owner:
      return 'Owner';
    case Role.Admin:
      return 'Admin';
    case Role.Developer:
      return 'Developer';
    case Role.ViewOnly:
      return 'Viewer';
    case Role.Custom:
    case Role.HasAdmin:
    case Role.NotAdmin:
      return 'Custom';
  }
}
