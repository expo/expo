import fs from 'fs';
import path from 'path';

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
