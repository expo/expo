import fs from 'fs';
import path from 'path';

import { addPlugin, prebuildProject } from './project';
import { PluginProps } from './types';

// SECTION: Validation functions

/**
 * Validates that the brownfield library is created
 */
export const validateBrownfieldLibrary = (
  projectRoot: string,
  libraryName: string = 'brownfield'
) => {
  const brownfieldPath = path.join(projectRoot, 'android', libraryName);
  expect(fs.existsSync(brownfieldPath)).toBe(true);
};

/**
 * Validates that all brownfield files are created
 */
export const validateBrownfieldFiles = (
  projectRoot: string,
  files: string[],
  libraryName: string = 'brownfield'
) => {
  const brownfieldPath = path.join(projectRoot, 'android', libraryName);
  files.forEach((file) => {
    const filePath = path.join(brownfieldPath, file);
    try {
      expect(fs.existsSync(filePath)).toBe(true);
    } catch (error) {
      const filename = path.basename(filePath);
      const files = fs
        .readdirSync(brownfieldPath, { recursive: true })
        .filter((file) => path.basename(file) === filename);
      throw new Error(
        `File at path: ${filePath} not found\nDid you mean any of the following files?\n${files.join('\n')}`
      );
    }
  });
};

/**
 * Validates that the settings.gradle file is modified correctly
 */
export const validateSettingsGradle = (projectRoot: string, libraryName: string = 'brownfield') => {
  const settingsGradlePath = path.join(projectRoot, 'android', 'settings.gradle');
  expect(fs.existsSync(settingsGradlePath)).toBe(true);

  const settingsGradleContents = fs.readFileSync(settingsGradlePath, 'utf8');
  expect(settingsGradleContents).toContain(`include ':${libraryName}'`);

  const pluginIncludeLines = [
    'def brownfieldPluginsPath = new File(',
    `commandLine("node", "--print", "require.resolve('expo-brownfield/package.json')")`,
    '"../gradle-plugins"',
    'includeBuild(brownfieldPluginsPath)',
  ];
  pluginIncludeLines.forEach((line) => {
    expect(settingsGradleContents).toContain(line);
  });
};

/**
 * Validates that the build.gradle file is modified correctly
 */
export const validateBuildGradle = (
  projectRoot: string,
  publishingLines: string[],
  libraryName: string = 'brownfield'
) => {
  const buildGradlePath = path.join(projectRoot, 'android', 'build.gradle');
  expect(fs.existsSync(buildGradlePath)).toBe(true);

  const buildGradleContents = fs.readFileSync(buildGradlePath, 'utf8');
  expect(buildGradleContents).toContain(`classpath('expo.modules:publish')`);
  expect(buildGradleContents).toContain(`apply plugin: "expo-brownfield-publish"`);

  const expectedPublishingLines = [
    'expoBrownfieldPublishPlugin {',
    `libraryName = "${libraryName}"`,
    'publications {',
    ...publishingLines,
  ];

  expectedPublishingLines.forEach((line) => {
    expect(buildGradleContents).toContain(line);
  });
};

// END SECTION: Validation functions

// SECTION: Helper functions

/**
 * Sets up the plugin for the project
 */
export const setupPlugin = async (
  projectRoot: string,
  pluginConfig?: PluginProps['android'],
  android?: Record<string, any>
) => {
  const props = pluginConfig ? { android: pluginConfig } : undefined;
  await addPlugin(projectRoot, props, android);
  await prebuildProject(projectRoot, 'android');
};

/**
 * Infers the paths for Android
 */
interface AndroidPaths {
  packagePath: string;
  sourcesPath: string;
}

export const getAndroidPaths = (packageId: string): AndroidPaths => {
  const sourcesPath = 'src/main';
  const paths = [sourcesPath, 'java'];

  packageId.split('.').forEach((part) => {
    paths.push(part);
  });

  return {
    packagePath: paths.join('/'),
    sourcesPath,
  };
};

/**
 * Gets the publishing lines for the build.gradle file
 */
export const getPublishingLines = (
  projectRoot: string,
  publishing: PluginProps['android']['publishing']
): string[] => {
  const lines = [];
  const count = {
    localMaven: 0,
    localDirectory: 0,
    remotePublic: 0,
    remotePrivate: 0,
  };

  let name, url, username, password;
  publishing.forEach((publication) => {
    count[publication.type]++;

    switch (publication.type) {
      case 'localMaven':
        lines.push('localDefault {', 'type.set("localMaven")');
        break;
      case 'localDirectory':
        name = publication.name ?? `localDirectory${count['localDirectory']} {`;
        url = path.isAbsolute(publication.path)
          ? publication.path
          : path.join(projectRoot, publication.path);
        lines.push(name, 'type.set("localDirectory")', `url.set("file://${url}")`);
        break;
      case 'remotePublic':
        name = publication.name ?? `remotePublic${count['remotePublic']} {`;
        url = publication.url;
        lines.push(name, 'type.set("remotePublic")', `url.set("${url}")`);
        if (publication.allowInsecure) {
          lines.push('allowInsecure.set(true)');
        }
        break;
      case 'remotePrivate':
        name = publication.name ?? `remotePrivate${count['remotePrivate']} {`;
        url =
          typeof publication.url === 'object'
            ? `url.set(providers.environmentVariable("${publication.url.variable}").orElse(""))`
            : `url.set("${publication.url}")`;
        username =
          typeof publication.username === 'object'
            ? `username.set(providers.environmentVariable("${publication.username.variable}").orElse(""))`
            : `username.set("${publication.username}")`;
        password =
          typeof publication.password === 'object'
            ? `password.set(providers.environmentVariable("${publication.password.variable}").orElse(""))`
            : `password.set("${publication.password}")`;
        lines.push(name, 'type.set("remotePrivate")', url, username, password);
        if (publication.allowInsecure) {
          lines.push('allowInsecure.set(true)');
        }
        break;
    }
  });

  return lines;
};

// END SECTION: Helper functions
