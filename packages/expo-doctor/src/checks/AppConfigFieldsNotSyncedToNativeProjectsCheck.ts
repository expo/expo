import fs from 'fs';
import path from 'path';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { learnMore } from '../utils/TerminalLink';
import { existsAndIsNotIgnoredAsync } from '../utils/files';

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
  description = 'Check for app config fields that may not be synced in a non-CNG project';

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
    const isBuildingOnEAS: boolean = fs.existsSync('eas.json');
    const prebuildMessage: string = isBuildingOnEAS
      ? 'EAS Build will not sync the following properties:'
      : `if you don't run prebuild in your build pipeline, the following properties will not be synced:`;
    let advice;
    const ignoreFile: string = fs.existsSync('.easignore') ? '.easignore' : '.gitignore';

    // iterate over all fields in app.json and add those that will not be synced to unsyncedFields array
    for (const field of appJsonFields) {
      if (appConfigFieldsToSyncWithNative.includes(field)) {
        unsyncedFields.push(field);
      }
    }

    if (
      unsyncedFields.length &&
      // git check-ignore needs a specific file to check gitignore, we choose Podfile or build.gradle
      ((await existsAndIsNotIgnoredAsync(
        path.join(projectRoot, 'ios', 'Podfile'),
        isBuildingOnEAS
      )) ||
        (await existsAndIsNotIgnoredAsync(
          path.join(projectRoot, 'android', 'build.gradle'),
          isBuildingOnEAS
        )))
    ) {
      // get the name of the config file
      const configFilePath = dynamicConfigPath ?? staticConfigPath;
      const configFileName = path.basename(configFilePath ?? 'app.json');

      issues.push(
        `This project contains native project folders but also has native configuration properties in ${configFileName}, indicating it is configured to use Prebuild. When the android/ios folders are present, ${prebuildMessage} ${unsyncedFields.join(', ')}. \n`
      );

      advice = `Add '/android' and '/ios' to your ${ignoreFile} file if you intend to use CNG / Prebuild.`;
      advice = isBuildingOnEAS
        ? `${advice} ${learnMore('https://docs.expo.dev/workflow/prebuild/#usage-with-eas-build')}`
        : advice;
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
      advice,
    };
  }
}
