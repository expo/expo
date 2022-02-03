import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';
import process from 'process';

import { deepCloneObject } from '../Utils';
import { Directories, XDL } from '../expotools';
import AppConfig from '../typings/AppConfig';
import { maybeUpdateHomeSdkVersionAsync } from './PublishDevExpoHomeCommand';

const EXPO_HOME_PATH = Directories.getExpoHomeJSDir();
const { EXPO_DOGFOOD_HOME_ACCESS_TOKEN } = process.env;

/**
 * Main action that runs once the command is invoked.
 */
async function action(): Promise<void> {
  if (!EXPO_DOGFOOD_HOME_ACCESS_TOKEN) {
    throw new Error('EXPO_DOGFOOD_HOME_ACCESS_TOKEN must be set in your environment.');
  }

  const appJsonFilePath = path.join(EXPO_HOME_PATH, 'app.json');
  const appJsonFile = new JsonFile<AppConfig>(appJsonFilePath);
  const appJson = await appJsonFile.readAsync();

  console.log(`Creating backup of ${chalk.magenta('app.json')} file...`);
  const appJsonBackup = deepCloneObject<AppConfig>(appJson);

  console.log(`Modifying home app.json...`);
  await maybeUpdateHomeSdkVersionAsync(appJson);
  appJson.expo.owner = 'expo-dogfooding';

  try {
    await appJsonFile.writeAsync(appJson);

    console.log(`Publishing ${chalk.green('@expo-dogfooding/home')}...`);

    await XDL.publishProjectWithExpoCliAsync(EXPO_HOME_PATH, {
      accessToken: EXPO_DOGFOOD_HOME_ACCESS_TOKEN,
    });

    console.log(`Finished publishing ${chalk.green('@expo-dogfooding/home')}`);
  } finally {
    // always restore from backup
    console.log(`Restoring ${chalk.magenta('app.json')} file from backup...`);
    await appJsonFile.writeAsync(appJsonBackup);
  }

  console.log(chalk.yellow(`Done.`));
}

export default (program: Command) => {
  program
    .command('publish-dogfood-home')
    .description(
      `Automatically publishes @expo-dogfooding/home using access token stored in EXPO_DOGFOOD_HOME_ACCESS_TOKEN environment variable.`
    )
    .asyncAction(action);
};
