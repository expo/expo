import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { isFileIgnoredAsync } from '../utils/isFileIgnoredAsync';

const appConfigFieldsToSyncWithNative = [
  'ios',
  'android',
  'plugins',
  'icon',
  'scheme',
  'userInterfaceStyle',
  'splash',
  'updates',
  'orientation',
  'backgroundColor',
  'primaryColor',
  'notification',
  'androidStatusBar',
  'androidNavigationBar',
  'jsEngine',
  'locales',
];

export class AppConfigFieldsNotSyncedToNativeProjectsCheck implements DoctorCheck {
  description = 'Check for app config fields not synced to native projects';

  sdkVersionRange = '*';

  async runAsync({
    exp,
    projectRoot,
    staticConfigPath,
    dynamicConfigPath,
  }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];
    const appJsonFields: string[] = Object.keys(exp);
    const unsyncedFields: string[] = [];
    let advice;

    // iterate over all fields in app.json and add those that will not be synced to unsyncedFields array
    for (const field of appJsonFields) {
      if (appConfigFieldsToSyncWithNative.includes(field)) {
        unsyncedFields.push(field);
      }
    }

    if (
      unsyncedFields.length &&
      // git check-ignore needs a specific file to check gitignore, we choose Podfile or build.gradle
      ((await existsAndIsNotIgnoredAsync(path.join(projectRoot, 'ios', 'Podfile'))) ||
        (await existsAndIsNotIgnoredAsync(path.join(projectRoot, 'android', 'build.gradle'))))
    ) {
      // get the name of the config file
      const myStaticConfigPath = staticConfigPath ?? 'app.json';
      const myDynamicConfigPath = dynamicConfigPath ?? 'app.config.js';
      const configFilePath = myStaticConfigPath ? myStaticConfigPath : myDynamicConfigPath;
      const configFileName = path.basename(configFilePath);

      issues.push(
        `This project has native project folders but also has native configuration fields in ${configFileName}, indicating it is configured to use Prebuild. When the iOS or Android folders are present, EAS Build will not sync the following ${configFileName} fields: ${unsyncedFields.join(', ')}. \n`
      );

      advice =
        'Add these folders to your .gitignore file if you intend to use Prebuild (also known as the "managed" workflow). Learn more: https://docs.expo.dev/workflow/prebuild/#usage-with-eas-build.';
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice,
    };
  }
}

async function existsAndIsNotIgnoredAsync(filePath: string): Promise<boolean> {
  return fs.existsSync(filePath) && !(await isFileIgnoredAsync(filePath));
}
