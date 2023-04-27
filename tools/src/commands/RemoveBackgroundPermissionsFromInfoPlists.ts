import { Command } from '@expo/commander';
import plist from '@expo/plist';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';

const INFO_PLIST_PATH = path.join(EXPO_DIR, 'ios/Exponent/Supporting/Info.plist');

async function action(): Promise<void> {
  const rawPlist = await fs.readFile(INFO_PLIST_PATH, 'utf-8');
  const parsedPlist = plist.parse(rawPlist);

  logger.info(
    `Removing NSLocationAlwaysAndWhenInUseUsageDescription from ios/Exponent/Supporting/Info.plist`
  );
  delete parsedPlist.NSLocationAlwaysAndWhenInUseUsageDescription;
  logger.info(`Removing NSLocationAlwaysUsageDescription from ios/Exponent/Supporting/Info.plist`);
  delete parsedPlist.NSLocationAlwaysUsageDescription;

  logger.info(
    `Removing location, audio and remonte-notfication from UIBackgroundModes from ios/Exponent/Supporting/Info.plist`
  );
  parsedPlist.UIBackgroundModes = parsedPlist.UIBackgroundModes.filter(
    (i: string) => !['location', 'audio', 'remote-notification'].includes(i)
  );
  await fs.writeFile(INFO_PLIST_PATH, plist.build(parsedPlist));
}

export default (program: Command) => {
  program
    .command('remove-background-permissions-from-info-plists', undefined, { noHelp: true })
    .description(
      'Removes permissions for background features that should be disabled in app store.'
    )
    .asyncAction(action);
};
