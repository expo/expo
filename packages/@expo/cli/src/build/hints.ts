import chalk from 'chalk';

import { Log } from '../log';

export function logPlatformBuildCommand(platform: string, argv: string[] = []) {
  Log.log(chalk.dim(`› Using expo build:${platform} ${argv.join(' ')}`));
}
