import chalk from 'chalk';

import { Log } from '../log';
import { isInteractive } from '../utils/interactive';

/** Log the device argument to use for the next run: `Using --device foobar` */
export function logDeviceArgument(id: string) {
  Log.log(chalk.dim`› Using --device ${id}`);
}

export function logPlatformRunCommand(platform: string, argv: string[] = []) {
  Log.log(chalk.dim(`› Using expo run:${platform} ${argv.join(' ')}`));
}

export function logProjectLogsLocation() {
  Log.log(
    chalk`\n› Logs for your project will appear below.${
      isInteractive() ? chalk.dim(` Press Ctrl+C to exit.`) : ''
    }`
  );
}
