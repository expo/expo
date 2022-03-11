import chalk from 'chalk';

import * as Log from '../log';
import { Options } from './resolveOptions';

export async function startAsync(
  projectRoot: string,
  options: Options,
  settings: { webOnly?: boolean }
) {
  Log.log(chalk.gray(`Starting project at ${projectRoot}`));
}
