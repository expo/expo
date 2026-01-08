import path from 'node:path';

import type { ExpoConfig } from 'expo/config';
import { withAndroidManifest } from 'expo/config-plugins';

import type { PluginConfig, PluginProps, Publication } from '../types';

export const getPluginConfig = (
  props: PluginProps,
  config: ExpoConfig,
): PluginConfig => {
  const libraryName = props?.libraryName || 'brownfield';
  const packageId = getPackage(config, props);

  return {
    group: getGroup(props, packageId),
    libraryName,
    package: packageId,
    packagePath: getPackagePath(packageId),
    projectRoot: getProjectRoot(config),
    publishing: getPublishing(props),
    version: getVersion(props),
  };
};

const getGroup = (props: PluginProps, packageId: string): string => {
  if (props?.group) {
    return props.group;
  }

  // Assumption: Correct package id in Java/Kotlin has at least one dot
  const lastDotIndex = packageId.lastIndexOf('.');
  return packageId.substring(0, lastDotIndex);
};

const getPackage = (config: ExpoConfig, props: PluginProps): string => {
  if (props?.package) {
    return props.package;
  }

  if (config.android?.package) {
    return config.android.package + '.brownfield';
  }

  return 'com.example.brownfield';
};

export const getPackagePath = (packageId: string) => {
  return path.join('java', ...packageId.split('.'));
};

export const getProjectRoot = (config: ExpoConfig): string => {
  let projectRoot = '';
  withAndroidManifest(config, (config) => {
    projectRoot = config.modRequest.projectRoot;
    return config;
  });

  if (!projectRoot && config._internal?.projectRoot) {
    projectRoot = config._internal.projectRoot as string;
  }

  return projectRoot;
};

export const getPublishing = (props: PluginProps): Publication[] => {
  return (
    props?.publishing || [
      {
        type: 'localMaven',
      },
    ]
  );
};

export const getVersion = (props: PluginProps): string => {
  return props?.version || '1.0.0';
};
