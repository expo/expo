import { ExpoConfig, modifyConfigAsync } from '@expo/config';
import chalk from 'chalk';

import * as Log from './log';

/** Wraps `[@expo/config] modifyConfigAsync()` and adds additional logging. */
export async function attemptModification(
  projectRoot: string,
  edits: Partial<ExpoConfig>,
  exactEdits: Partial<ExpoConfig>
): Promise<void> {
  const modification = await modifyConfigAsync(projectRoot, edits, {
    skipSDKVersionRequirement: true,
  });
  if (modification.type === 'success') {
    Log.log();
  } else {
    warnAboutConfigAndThrow(modification.type, modification.message!, exactEdits);
  }
}

function warnAboutConfigAndThrow(type: string, message: string, edits: Partial<ExpoConfig>) {
  Log.log();
  if (type === 'warn') {
    // The project is using a dynamic config, give the user a helpful log and bail out.
    Log.log(chalk.yellow(message));
  }

  notifyAboutManualConfigEdits(edits);
  throw new Error();
}

function notifyAboutManualConfigEdits(edits: Partial<ExpoConfig>) {
  Log.log(chalk.cyan(`Please add the following to your Expo config`));
  Log.log();
  Log.log(JSON.stringify(edits, null, 2));
  Log.log();
}
