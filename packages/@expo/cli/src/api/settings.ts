// This file represents temporary globals for the CLI when using the API.
// Settings should be as minimal as possible since they are globals.
import { styleText } from 'node:util';

import { Log } from '../log';
import { env } from '../utils/env';

export function disableNetwork() {
  if (env.EXPO_OFFLINE) return;
  process.env.EXPO_OFFLINE = '1';
  Log.log(styleText('gray', 'Networking has been disabled'));
}
