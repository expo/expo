/**
 * BundleIdentifier.ts
 *
 * NOTE:
 * The code in this module originates from eas-cli and the canonical version of
 * it is in
 * https://github.com/expo/eas-cli/blob/6a0a9bbaaad03b053b5930f7d14bde35b4d0a9f0/packages/eas-cli/src/build/ios/bundleIdentifer.ts#L36
 * Any changes to this code should be applied to eas-cli as well!
 *
 * TODO: move the code for configuring and validating the bundle identifier
 * to a shared package that can be used for both eas-cli and expo-cli.
 */
import { ExpoConfig, getConfigFilePaths, getProjectConfigDescription } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import JsonFile from '@expo/json-file';
import assert from 'assert';
import chalk from 'chalk';
import { prompt } from 'prompts';

import * as Log from '../../log';

enum BundleIdentiferSource {
  XcodeProject,
  AppJson,
}

export async function configureBundleIdentifierAsync(
  projectRoot: string,
  exp: ExpoConfig
): Promise<string> {
  const configDescription = getProjectConfigDescription(projectRoot);
  const bundleIdentifierFromPbxproj =
    IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj(projectRoot);
  const bundleIdentifierFromConfig = IOSConfig.BundleIdentifier.getBundleIdentifier(exp);
  if (bundleIdentifierFromPbxproj && bundleIdentifierFromConfig) {
    if (bundleIdentifierFromPbxproj === bundleIdentifierFromConfig) {
      return bundleIdentifierFromConfig;
    } else {
      Log.warn(
        `We detected that your Xcode project is configured with a different bundle identifier than the one defined in ${configDescription}.`
      );
      const hasBundleIdentifierInStaticConfig = await hasBundleIdentifierInStaticConfigAsync(
        projectRoot,
        exp
      );
      if (!hasBundleIdentifierInStaticConfig) {
        Log.log(
          `If you choose the one defined in ${configDescription} we'll automatically configure your Xcode project with it.
 However, if you choose the one defined in the Xcode project you'll have to update ${configDescription} on your own.`
        );
      }
      const { bundleIdentifierSource } = await prompt({
        type: 'select',
        name: 'bundleIdentifierSource',
        message: 'Which bundle identifier should we use?',
        choices: [
          {
            title: `${chalk.bold(bundleIdentifierFromPbxproj)} - In Xcode project`,
            value: BundleIdentiferSource.XcodeProject,
          },
          {
            title: `${chalk.bold(bundleIdentifierFromConfig)} - In your ${configDescription}`,
            value: BundleIdentiferSource.AppJson,
          },
        ],
      });
      if (bundleIdentifierSource === BundleIdentiferSource.AppJson) {
        IOSConfig.BundleIdentifier.setBundleIdentifierForPbxproj(
          projectRoot,
          bundleIdentifierFromConfig
        );
        return bundleIdentifierFromConfig;
      } else {
        if (hasBundleIdentifierInStaticConfig) {
          await updateAppJsonConfigAsync(projectRoot, exp, bundleIdentifierFromPbxproj);
        } else {
          throw new Error(missingBundleIdentifierMessage(configDescription));
        }
        return bundleIdentifierFromPbxproj;
      }
    }
  } else if (bundleIdentifierFromPbxproj && !bundleIdentifierFromConfig) {
    if (getConfigFilePaths(projectRoot).staticConfigPath) {
      await updateAppJsonConfigAsync(projectRoot, exp, bundleIdentifierFromPbxproj);
    }
    return bundleIdentifierFromPbxproj;
  } else if (!bundleIdentifierFromPbxproj && bundleIdentifierFromConfig) {
    IOSConfig.BundleIdentifier.setBundleIdentifierForPbxproj(
      projectRoot,
      bundleIdentifierFromConfig
    );
    return bundleIdentifierFromConfig;
  } else {
    throw new Error(missingBundleIdentifierMessage(configDescription));
  }
}

function missingBundleIdentifierMessage(configDescription: string): string {
  return `Please define "ios.bundleIdentifier" in ${configDescription}.`;
}

async function updateAppJsonConfigAsync(
  projectRoot: string,
  exp: ExpoConfig,
  newBundleIdentifier: string
): Promise<void> {
  const paths = getConfigFilePaths(projectRoot);
  assert(paths.staticConfigPath, "Can't update dynamic configs");

  const rawStaticConfig = (await JsonFile.readAsync(paths.staticConfigPath)) as any;
  rawStaticConfig.expo = {
    ...rawStaticConfig.expo,
    ios: { ...rawStaticConfig.expo?.ios, bundleIdentifier: newBundleIdentifier },
  };
  await JsonFile.writeAsync(paths.staticConfigPath, rawStaticConfig);

  exp.ios = { ...exp.ios, bundleIdentifier: newBundleIdentifier };
}

/**
 * Check if static config exists and if ios.bundleIdentifier is defined there.
 * It will return false if the value in static config is different than "ios.bundleIdentifier" in ExpoConfig
 */
async function hasBundleIdentifierInStaticConfigAsync(
  projectRoot: string,
  exp: ExpoConfig
): Promise<boolean> {
  if (!exp.ios?.bundleIdentifier) {
    return false;
  }
  const paths = getConfigFilePaths(projectRoot);
  if (!paths.staticConfigPath) {
    return false;
  }
  const rawStaticConfig = JsonFile.read(paths.staticConfigPath) as any;
  return rawStaticConfig?.expo?.ios?.bundleIdentifier === exp.ios.bundleIdentifier;
}
