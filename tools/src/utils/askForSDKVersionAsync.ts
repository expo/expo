import inquirer from 'inquirer';
import { styleText } from 'node:util';
import semver from 'semver';

import { Platform, getSDKVersionsAsync } from '../ProjectVersions';

export default async function askForSDKVersionAsync(
  platform: Platform,
  defaultSdkVersion?: string
) {
  const sdkVersions = await getSDKVersionsAsync(platform);

  if (process.env.CI) {
    if (defaultSdkVersion) {
      console.log(
        `${styleText('red', '`--sdkVersion`')} not provided - defaulting to ${styleText('cyan', defaultSdkVersion)}.`
      );
      return defaultSdkVersion;
    }
    throw new Error(
      `${styleText('red', '`--sdkVersion`')} not provided and unable to obtain default value.`
    );
  }

  const defaultValue =
    defaultSdkVersion && sdkVersions.includes(defaultSdkVersion)
      ? defaultSdkVersion
      : sdkVersions[sdkVersions.length - 1];
  const { sdkVersion } = await inquirer.prompt<{ sdkVersion: string }>([
    {
      type: 'list',
      name: 'sdkVersion',
      message: 'What is the SDK version that you want to run this script against?',
      default: defaultValue,
      choices: sdkVersions,
      validate(value) {
        if (!semver.valid(value)) {
          return `Invalid version: ${styleText('cyan', value)}`;
        }
        return true;
      },
    },
  ]);
  return sdkVersion;
}
