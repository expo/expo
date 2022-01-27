import chalk from 'chalk';

import * as Log from '../log';
import { getActorDisplayName, getUserAsync } from '../utils/user/user';

export async function whoamiAsync() {
  const user = await getUserAsync();
  if (user) {
    Log.exit(chalk.green(getActorDisplayName(user)), 0);
  } else {
    Log.exit('Not logged in', 1);
  }
}
