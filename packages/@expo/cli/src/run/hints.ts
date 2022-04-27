import chalk from 'chalk';

import { Log } from '../log';
import { env } from '../utils/env';

/** Log the device argument to use for the next run: `Using --device foobar` */
export function logDeviceArgument(id: string) {
  Log.log(chalk.dim`› Using --device ${id}`);
}

export function logProjectLogsLocation() {
  Log.log(
    chalk`› Logs for your project will appear below.${
      env.CI ? '' : chalk.dim(` Press Ctrl+C to exit.`)
    }`
  );
}
