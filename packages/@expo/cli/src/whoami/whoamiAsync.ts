import chalk from 'chalk';

import { getActorDisplayName, getUserAsync } from '../api/user/user';
import * as Log from '../log';

export async function whoamiAsync() {
  const user = await getUserAsync();
  if (user) {
    Log.exit(chalk.green(getActorDisplayName(user)), 0);
  } else {
    Log.exit('Not logged in');
  }
}
