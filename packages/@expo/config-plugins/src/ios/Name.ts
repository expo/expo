import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';

import { ConfigPlugin } from '../Plugin.types';
import { createInfoPlistPluginWithPropertyGuard, withXcodeProject } from '../plugins/ios-plugins';
import { InfoPlist } from './IosConfig.types';
import { findFirstNativeTarget } from './Target';
import {
  ConfigurationSectionEntry,
  getBuildConfigurationsForListId,
  sanitizedName,
} from './utils/Xcodeproj';

export const withDisplayName = createInfoPlistPluginWithPropertyGuard(
  setDisplayName,
  {
    infoPlistProperty: 'CFBundleDisplayName',
    expoConfigProperty: 'name',
  },
  'withDisplayName'
);

export const withName = createInfoPlistPluginWithPropertyGuard(
  setName,
  {
    infoPlistProperty: 'CFBundleName',
    expoConfigProperty: 'name',
  },
  'withName'
);

/** Set the PRODUCT_NAME variable in the xcproj file based on the app.json name property. */
export const withProductName: ConfigPlugin = config => {
  return withXcodeProject(config, config => {
    config.modResults = setProductName(config, config.modResults);
    return config;
  });
};

export function getName(config: Pick<ExpoConfig, 'name'>) {
  return typeof config.name === 'string' ? config.name : null;
}

/**
 * CFBundleDisplayName is used for most things: the name on the home screen, in
 * notifications, and others.
 */
export function setDisplayName(
  configOrName: Pick<ExpoConfig, 'name'> | string,
  { CFBundleDisplayName, ...infoPlist }: InfoPlist
): InfoPlist {
  let name: string | null = null;
  if (typeof configOrName === 'string') {
    name = configOrName;
  } else {
    name = getName(configOrName);
  }

  if (!name) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    CFBundleDisplayName: name,
  };
}

/**
 * CFBundleName is recommended to be 16 chars or less and is used in lists, eg:
 * sometimes on the App Store
 */
export function setName(
  config: Pick<ExpoConfig, 'name'>,
  { CFBundleName, ...infoPlist }: InfoPlist
): InfoPlist {
  const name = getName(config);

  if (!name) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    CFBundleName: name,
  };
}

export function setProductName(
  config: Pick<ExpoConfig, 'name'>,
  project: XcodeProject
): XcodeProject {
  const name = sanitizedName(getName(config) ?? '');

  if (!name) {
    return project;
  }
  const quotedName = ensureQuotes(name);

  const [, nativeTarget] = findFirstNativeTarget(project);

  getBuildConfigurationsForListId(project, nativeTarget.buildConfigurationList).forEach(
    ([, item]: ConfigurationSectionEntry) => {
      item.buildSettings.PRODUCT_NAME = quotedName;
    }
  );

  return project;
}

const ensureQuotes = (value: string) => {
  if (!value.match(/^['"]/)) {
    return `"${value}"`;
  }
  return value;
};
