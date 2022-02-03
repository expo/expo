import * as fs from 'fs-extra';
import walkSync from 'klaw-sync';
import * as path from 'path';

import { ModuleConfiguration } from './ModuleConfiguration';

type PreparedPrefixes = [nameWithExpoPrefix: string, nameWithoutExpoPrefix: string];

/**
 * prepares _Expo_ prefixes for specified name
 * @param name module name, e.g. JS package name
 * @param prefix prefix to prepare with, defaults to _Expo_
 * @returns tuple `[nameWithPrefix: string, nameWithoutPrefix: string]`
 */
const preparePrefixes = (name: string, prefix: string = 'Expo'): PreparedPrefixes =>
  name.startsWith(prefix) ? [name, name.substr(prefix.length)] : [`${prefix}${name}`, name];

const asyncForEach = async <T>(
  array: T[],
  callback: (value: T, index: number, array: T[]) => Promise<void>
) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

/**
 * Removes specified files. If one file doesn't exist already, skips it
 * @param directoryPath directory containing files to remove
 * @param filenames array of filenames to remove
 */
async function removeFiles(directoryPath: string, filenames: string[]) {
  await Promise.all(filenames.map((filename) => fs.remove(path.resolve(directoryPath, filename))));
}

/**
 * Renames files names
 * @param directoryPath - directory that holds files to be renamed
 * @param extensions - array of extensions for files that would be renamed, must be provided with leading dot or empty for no extension, e.g. ['.html', '']
 * @param renamings - array of filenames and their replacers
 */
const renameFilesWithExtensions = async (
  directoryPath: string,
  extensions: string[],
  renamings: { from: string; to: string }[]
) => {
  await asyncForEach(
    renamings,
    async ({ from, to }) =>
      await asyncForEach(extensions, async (extension) => {
        const fromFilename = `${from}${extension}`;
        if (!fs.existsSync(path.join(directoryPath, fromFilename))) {
          return;
        }
        const toFilename = `${to}${extension}`;
        await fs.rename(
          path.join(directoryPath, fromFilename),
          path.join(directoryPath, toFilename)
        );
      })
  );
};

/**
 * Enters each file recursively in provided dir and replaces content by invoking provided callback function
 * @param directoryPath - root directory
 * @param replaceFunction - function that converts current content into something different
 */
const replaceContents = async (
  directoryPath: string,
  replaceFunction: (contentOfSingleFile: string) => string
) => {
  await Promise.all(
    walkSync(directoryPath, { nodir: true }).map((file) =>
      replaceContent(file.path, replaceFunction)
    )
  );
};

/**
 * Replaces content in file. Does nothing if the file doesn't exist
 * @param filePath - provided file
 * @param replaceFunction - function that converts current content into something different
 */
const replaceContent = async (
  filePath: string,
  replaceFunction: (contentOfSingleFile: string) => string
) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = await fs.readFile(filePath, 'utf8');
  const newContent = replaceFunction(content);
  if (newContent !== content) {
    await fs.writeFile(filePath, newContent);
  }
};

/**
 * Removes all empty subdirs up to and including dirPath
 * Recursively enters all subdirs and removes them if one is empty or cantained only empty subdirs
 * @param dirPath - directory path that is being inspected
 * @returns whether the given base directory and any empty subdirectories were deleted or not
 */
const removeUponEmptyOrOnlyEmptySubdirs = async (dirPath: string): Promise<boolean> => {
  const contents = await fs.readdir(dirPath);
  const results = await Promise.all(
    contents.map(async (file) => {
      const filePath = path.join(dirPath, file);
      const fileStats = await fs.lstat(filePath);
      return fileStats.isDirectory() && (await removeUponEmptyOrOnlyEmptySubdirs(filePath));
    })
  );
  const isRemovable = results.reduce((acc, current) => acc && current, true);
  if (isRemovable) {
    await fs.remove(dirPath);
  }
  return isRemovable;
};

/**
 * Prepares iOS part, mainly by renaming all files and some template word in files
 * Versioning is done automatically based on package.json from JS/TS part
 * @param modulePath - module directory
 * @param configuration - naming configuration
 */
async function configureIOS(
  modulePath: string,
  { podName, jsPackageName, viewManager }: ModuleConfiguration
) {
  const iosPath = path.join(modulePath, 'ios');

  // remove ViewManager from template
  if (!viewManager) {
    await removeFiles(iosPath, [
      `EXModuleTemplateView.h`,
      `EXModuleTemplateView.m`,
      `EXModuleTemplateViewManager.h`,
      `EXModuleTemplateViewManager.m`,
    ]);
  }

  await renameFilesWithExtensions(
    iosPath,
    ['.swift'],
    [
      { from: 'ExpoModuleTemplateModule', to: `${podName}Module` },
      {
        from: 'ExpoModuleTemplateView',
        to: `${podName}View`,
      },
      {
        from: 'ExpoModuleTemplateViewManager',
        to: `${podName}ViewManager`,
      },
    ]
  );
  await renameFilesWithExtensions(
    iosPath,
    ['', '.podspec'],
    [{ from: 'ExpoModuleTemplate', to: `${podName}` }]
  );
  await replaceContents(iosPath, (singleFileContent) =>
    singleFileContent
      .replace(/ExpoModuleTemplate/g, podName)
      .replace(/ExpoModuleTemplate/g, jsPackageName)
  );
}

/**
 * Gets path to Android source base dir: android/src/main/[java|kotlin]
 * Defaults to Java path if both exist
 * @param androidPath path do module android/ directory
 * @param flavor package flavor e.g main, test. Defaults to main
 * @returns path to flavor source base directory
 */
function findAndroidSourceDir(androidPath: string, flavor: string = 'main'): string {
  const androidSrcPathBase = path.join(androidPath, 'src', flavor);

  const javaExists = fs.pathExistsSync(path.join(androidSrcPathBase, 'java'));
  const kotlinExists = fs.pathExistsSync(path.join(androidSrcPathBase, 'kotlin'));

  if (!javaExists && !kotlinExists) {
    throw new Error(
      `Invalid template. Android source directory not found: ${androidSrcPathBase}/[java|kotlin]`
    );
  }

  return path.join(androidSrcPathBase, javaExists ? 'java' : 'kotlin');
}

/**
 * Finds java package name based on directory structure
 * @param flavorSrcPath Path to source base directory: e.g. android/src/main/java
 * @returns java package name
 */
function findTemplateAndroidPackage(flavorSrcPath: string) {
  const srcFiles = walkSync(flavorSrcPath, {
    filter: (item) => item.path.endsWith('.kt') || item.path.endsWith('.java'),
    nodir: true,
    traverseAll: true,
  });

  if (srcFiles.length === 0) {
    throw new Error('No Android source files found in the template');
  }

  // srcFiles[0] will always be at the most top-level of the package structure
  const packageDirNames = path.relative(flavorSrcPath, srcFiles[0].path).split('/').slice(0, -1);

  if (packageDirNames.length === 0) {
    throw new Error('Template Android sources must be within a package.');
  }

  return packageDirNames.join('.');
}

/**
 * Prepares Android part, mainly by renaming all files and template words in files
 * Sets all versions in Gradle to 1.0.0
 * @param modulePath - module directory
 * @param configuration - naming configuration
 */
async function configureAndroid(
  modulePath: string,
  { javaPackage, jsPackageName, viewManager }: ModuleConfiguration
) {
  const androidPath = path.join(modulePath, 'android');
  const [, moduleName] = preparePrefixes(jsPackageName, 'Expo');

  const androidSrcPath = findAndroidSourceDir(androidPath);
  const templateJavaPackage = findTemplateAndroidPackage(androidSrcPath);

  const sourceFilesPath = path.join(androidSrcPath, ...templateJavaPackage.split('.'));
  const destinationFilesPath = path.join(androidSrcPath, ...javaPackage.split('.'));

  // remove ViewManager from template
  if (!viewManager) {
    removeFiles(sourceFilesPath, [`ModuleTemplateView.kt`, `ModuleTemplateViewManager.kt`]);

    replaceContent(path.join(sourceFilesPath, 'ModuleTemplatePackage.kt'), (packageContent) =>
      packageContent
        .replace(/(^\s+)+(^.*?){1}createViewManagers[\s\W\w]+?\}/m, '')
        .replace(/^.*ViewManager$/, '')
    );
  }

  await fs.mkdirp(destinationFilesPath);
  await fs.copy(sourceFilesPath, destinationFilesPath);

  // Remove leaf directory content
  await fs.remove(sourceFilesPath);
  // Cleanup all empty subdirs up to template package root dir
  await removeUponEmptyOrOnlyEmptySubdirs(
    path.join(androidSrcPath, templateJavaPackage.split('.')[0])
  );

  // prepare tests
  if (fs.existsSync(path.resolve(androidPath, 'src', 'test'))) {
    const androidTestPath = findAndroidSourceDir(androidPath, 'test');
    const templateTestPackage = findTemplateAndroidPackage(androidTestPath);
    const testSourcePath = path.join(androidTestPath, ...templateTestPackage.split('.'));
    const testDestinationPath = path.join(androidTestPath, ...javaPackage.split('.'));

    await fs.mkdirp(testDestinationPath);
    await fs.copy(testSourcePath, testDestinationPath);
    await fs.remove(testSourcePath);
    await removeUponEmptyOrOnlyEmptySubdirs(
      path.join(androidTestPath, templateTestPackage.split('.')[0])
    );

    await replaceContents(testDestinationPath, (singleFileContent) =>
      singleFileContent.replace(new RegExp(templateTestPackage, 'g'), javaPackage)
    );

    await renameFilesWithExtensions(
      testDestinationPath,
      ['.kt', '.java'],
      [{ from: 'ModuleTemplateModuleTest', to: `${moduleName}ModuleTest` }]
    );
  }

  // Replace contents of destination files
  await replaceContents(androidPath, (singleFileContent) =>
    singleFileContent
      .replace(new RegExp(templateJavaPackage, 'g'), javaPackage)
      .replace(/ModuleTemplate/g, moduleName)
      .replace(/ExpoModuleTemplate/g, jsPackageName)
  );
  await replaceContent(path.join(androidPath, 'build.gradle'), (gradleContent) =>
    gradleContent
      .replace(/\bversion = ['"][\w.-]+['"]/, "version = '1.0.0'")
      .replace(/versionCode \d+/, 'versionCode 1')
      .replace(/versionName ['"][\w.-]+['"]/, "versionName '1.0.0'")
  );
  await renameFilesWithExtensions(
    destinationFilesPath,
    ['.kt', '.java'],
    [
      { from: 'ModuleTemplateModule', to: `${moduleName}Module` },
      { from: 'ModuleTemplatePackage', to: `${moduleName}Package` },
      { from: 'ModuleTemplateView', to: `${moduleName}View` },
      { from: 'ModuleTemplateViewManager', to: `${moduleName}ViewManager` },
    ]
  );
}

/**
 * Prepares TS part.
 * @param modulePath - module directory
 * @param configuration - naming configuration
 */
async function configureTS(
  modulePath: string,
  { jsPackageName, viewManager }: ModuleConfiguration
) {
  const [moduleNameWithExpoPrefix, moduleName] = preparePrefixes(jsPackageName);

  const tsPath = path.join(modulePath, 'src');

  // remove View Manager from template
  if (!viewManager) {
    await removeFiles(path.join(tsPath), [
      'ExpoModuleTemplateView.tsx',
      'ExpoModuleTemplateNativeView.ts',
      'ExpoModuleTemplateNativeView.web.tsx',
    ]);
    await replaceContent(path.join(tsPath, 'ModuleTemplate.ts'), (fileContent) =>
      fileContent.replace(/(^\s+)+(^.*?){1}ExpoModuleTemplateView.*$/m, '')
    );
  }

  await renameFilesWithExtensions(
    path.join(tsPath, '__tests__'),
    ['.ts'],
    [{ from: 'ModuleTemplate-test', to: `${moduleName}-test` }]
  );
  await renameFilesWithExtensions(
    tsPath,
    ['.tsx', '.ts'],
    [
      { from: 'ExpoModuleTemplateView', to: `${moduleNameWithExpoPrefix}View` },
      { from: 'ExpoModuleTemplateNativeView', to: `${moduleNameWithExpoPrefix}NativeView` },
      { from: 'ExpoModuleTemplateNativeView.web', to: `${moduleNameWithExpoPrefix}NativeView.web` },
      { from: 'ExpoModuleTemplate', to: moduleNameWithExpoPrefix },
      { from: 'ExpoModuleTemplate.web', to: `${moduleNameWithExpoPrefix}.web` },
      { from: 'ModuleTemplate', to: moduleName },
      { from: 'ModuleTemplate.types', to: `${moduleName}.types` },
    ]
  );

  await replaceContents(tsPath, (singleFileContent) =>
    singleFileContent
      .replace(/ExpoModuleTemplate/g, moduleNameWithExpoPrefix)
      .replace(/ModuleTemplate/g, moduleName)
  );
}

/**
 * Prepares files for npm (package.json and README.md).
 * @param modulePath - module directory
 * @param configuration - naming configuration
 */
async function configureNPM(
  modulePath: string,
  { npmModuleName, podName, jsPackageName }: ModuleConfiguration
) {
  const [, moduleName] = preparePrefixes(jsPackageName);

  await replaceContent(path.join(modulePath, 'package.json'), (singleFileContent) =>
    singleFileContent
      .replace(/expo-module-template/g, npmModuleName)
      .replace(/"version": "[\w.-]+"/, '"version": "1.0.0"')
      .replace(/ExpoModuleTemplate/g, jsPackageName)
      .replace(/ModuleTemplate/g, moduleName)
  );
  await replaceContent(path.join(modulePath, 'README.md'), (readmeContent) =>
    readmeContent
      .replace(/expo-module-template/g, npmModuleName)
      .replace(/ExpoModuleTemplate/g, jsPackageName)
      .replace(/EXModuleTemplate/g, podName)
  );
}

/**
 * Configures TS, Android and iOS parts of generated module mostly by applying provided renamings.
 * @param modulePath - module directory
 * @param configuration - naming configuration
 */
export default async function configureModule(
  newModulePath: string,
  configuration: ModuleConfiguration
) {
  await configureNPM(newModulePath, configuration);
  await configureTS(newModulePath, configuration);
  await configureAndroid(newModulePath, configuration);
  await configureIOS(newModulePath, configuration);
}
