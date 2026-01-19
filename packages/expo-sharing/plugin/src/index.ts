import { ConfigPlugin, createRunOncePlugin, StaticPlugin, withPlugins } from '@expo/config-plugins';

import { parseIntentFilters } from './android/parseIntentFilters';
import { withAndroidIntentFilters } from './android/withAndroidIntentFilters';
import { withShareIntoSchemeString } from './android/withShareIntoSchemeString';
import { ShareExtensionFiles } from './ios/setupShareExtensionFiles';
import { withAppGroupId } from './ios/withAppGroupId';
import { withShareExtensionFiles } from './ios/withShareExtensionFiles';
import { withShareExtensionXcodeProject } from './ios/withShareExtensionXcodeProject';
import { ShareExtensionConfigPluginProps } from './sharingPlugin.types';
import { withConfig } from './withConfig';

const EXPO_SHARE_EXTENSION_TARGET_NAME = 'expo-sharing-extension';
const pkg = require('expo-sharing/package.json');

type ShareExtensionConfigPlugin = ConfigPlugin<ShareExtensionConfigPluginProps>;

const withShareExtension: ShareExtensionConfigPlugin = (config, props?) => {
  let plugins: (StaticPlugin | ConfigPlugin | string)[] = [];
  const iosEnabled = props?.ios?.enabled ?? true;
  const androidEnabled = props?.android?.enabled ?? true;

  if (iosEnabled) {
    const deploymentTarget = '15.1';
    const bundleIdentifier = config.ios?.bundleIdentifier;
    if (!bundleIdentifier) {
      throw new Error(
        "The application config doesn't define a bundle identifier. Make sure that `ios.bundleIdentifier` field has a value."
      );
    }
    const extensionBundleIdentifier =
      props?.ios?.extensionBundleIdentifier ??
      `${config.ios?.bundleIdentifier}.${EXPO_SHARE_EXTENSION_TARGET_NAME}`;
    const fallbackAppGroupId = `group.${bundleIdentifier}`;
    const appGroupId = props?.ios?.appGroupId ?? fallbackAppGroupId;
    const urlScheme = (config.scheme ?? bundleIdentifier) as string; // TODO: Fix this type;
    const activationRule = props?.ios?.activationRule ?? {
      supportsText: true,
      supportsWebUrlWithMaxCount: 1,
    };

    if (!urlScheme) {
      throw new Error(
        `Expo sharing: The app doesn't define a scheme or a bundle identifier. Define at least one of those properties in app json`
      );
    }
    if (!props?.ios?.appGroupId) {
      console.warn(
        `Expo sharing: Using the default ${fallbackAppGroupId} app group id. If you are using EAS Build` +
          ` no further steps are required, otherwise make sure that this app group is registered` +
          ` with your Apple development team, or set \`ios.appGroupId\` field to an already registered app group.`
      );
    }

    const shareExtensionFiles: ShareExtensionFiles = {} as ShareExtensionFiles;

    plugins = [
      ...plugins,
      [
        withConfig,
        {
          bundleIdentifier: extensionBundleIdentifier,
          targetName: EXPO_SHARE_EXTENSION_TARGET_NAME,
          groupIdentifier: appGroupId,
        },
      ],
      [withAppGroupId, appGroupId],
      [
        withShareExtensionFiles,
        {
          targetName: EXPO_SHARE_EXTENSION_TARGET_NAME,
          appGroupId,
          urlScheme,
          activationRule,
          onFilesWritten: (writtenFiles: ShareExtensionFiles) => {
            Object.assign(shareExtensionFiles, writtenFiles);
          },
        },
      ],
      [
        withShareExtensionXcodeProject,
        {
          targetName: EXPO_SHARE_EXTENSION_TARGET_NAME,
          bundleIdentifier: extensionBundleIdentifier,
          deploymentTarget,
          activationRule,
          shareExtensionFiles,
        },
      ],
    ];
  }

  if (androidEnabled) {
    const urlScheme = config.scheme ?? config.android?.package;

    if (!urlScheme) {
      throw new Error(
        "The application config doesn't define a scheme or an Android package. Define the scheme in the app config."
      );
    }

    const singleIntentFilter = parseIntentFilters(
      props?.android?.singleShareMimeTypes ?? [],
      'single'
    );
    const multiIntentFilter = parseIntentFilters(
      props?.android?.multipleShareMimeTypes ?? [],
      'multiple'
    );

    plugins = [
      ...plugins,
      [
        withAndroidIntentFilters,
        {
          intentFilters: [singleIntentFilter, multiIntentFilter],
        },
      ],
      [withShareIntoSchemeString, urlScheme],
    ];
  }

  return withPlugins(config, plugins);
};

export default createRunOncePlugin(withShareExtension, pkg.name, pkg.version);
