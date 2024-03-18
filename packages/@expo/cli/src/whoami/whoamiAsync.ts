import chalk from 'chalk';

import { getActorDisplayName, getUserAsync } from '../api/user/user';
import * as Log from '../log';

export async function whoamiAsync() {
  const user = await getUserAsync();
  if (user) {
    Log.log(chalk.green(getActorDisplayName(user)));
  } else {
    Log.log('Not logged in');
  }
}
