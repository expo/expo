import type { ExpoConfig } from 'expo/config';
import { withAndroidManifest } from 'expo/config-plugins';
import path from 'node:path';

import type { PluginConfig, PluginProps, Publication } from '../types';
import { validateGradleField } from './validation';

export const getPluginConfig = (props: PluginProps, config: ExpoConfig): PluginConfig => {
  const libraryName = validateGradleField(
    'gradleProjectName',
    props?.libraryName || 'brownfield',
    'android.libraryName'
  );
  const packageId = validateGradleField(
    'javaPackage',
    getPackage(config, props),
    'android.package'
  );
  const group = validateGradleField('javaPackage', getGroup(props, packageId), 'android.group');
  const version = validateGradleField('mavenVersion', getVersion(props), 'android.version');

  return {
    group,
    libraryName,
    package: packageId,
    packagePath: getPackagePath(packageId),
    projectRoot: getProjectRoot(config),
    publishing: validatePublishing(getPublishing(props)),
    version,
  };
};

const validatePublishing = (publications: Publication[]): Publication[] => {
  return publications.map((publication, index) => {
    if (publication.type === 'localMaven') {
      return publication;
    }

    if (publication.name !== undefined) {
      validateGradleField(
        'groovyIdentifier',
        publication.name,
        `android.publishing[${index}].name`
      );
    }

    if (publication.type === 'localDirectory') {
      return publication;
    }

    if (typeof publication.url !== 'string') {
      validateGradleField(
        'envVarName',
        publication.url.variable,
        `android.publishing[${index}].url.variable`
      );
    }

    if (publication.type === 'remotePrivate') {
      if (typeof publication.username !== 'string') {
        validateGradleField(
          'envVarName',
          publication.username.variable,
          `android.publishing[${index}].username.variable`
        );
      }
      if (typeof publication.password !== 'string') {
        validateGradleField(
          'envVarName',
          publication.password.variable,
          `android.publishing[${index}].password.variable`
        );
      }
    }

    return {
      ...publication,
      allowInsecure: Boolean(publication.allowInsecure),
    };
  });
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
