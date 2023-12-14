import chalk from 'chalk';

import { learnMore } from './link';
import { Log } from '../log';

let hasWarnedAboutApiRouteOutput = false;
export function warnInvalidWebOutput() {
  if (!hasWarnedAboutApiRouteOutput) {
    Log.warn(
      chalk.yellow`Using API routes requires the \`web.output\` to be set to 'server'. Please update your \`app.json\` ${learnMore(
        'https://docs.expo.dev/versions/latest/config/app/#web'
      )}`
    );
  }

  hasWarnedAboutApiRouteOutput = true;
}
