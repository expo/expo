import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import semver from 'semver';
import { find } from 'find-in-files';

import { getExpoRepositoryRootDir } from '../../Directories';

const EXPO_DIR = getExpoRepositoryRootDir();

function getProjectPaths(abiName: string) {
  const androidPath = path.join(EXPO_DIR, 'android');
  const appPath = path.join(androidPath, 'app');
  const expoviewPath = path.join(androidPath, 'expoview');
  const versionedExpoviewAbiPath = path.join(androidPath, 'versioned-abis', `expoview-${abiName}`);
  const expoviewBuildGradlePath = path.join(expoviewPath, 'build.gradle');
  const appManifestPath = path.join(appPath, 'src', 'main', 'AndroidManifest.xml');
  const templateManifestPath = path.join(EXPO_DIR, 'template-files', 'android', 'AndroidManifest.xml');
  const settingsGradlePath = path.join(androidPath, 'settings.gradle');
  const appBuildGradlePath = path.join(appPath, 'build.gradle');
  const buildGradlePath = path.join(androidPath, 'build.gradle');
  const sdkVersionsPath = path.join(androidPath, 'sdkVersions.json');
  const rnActivityPath = path.join(expoviewPath, 'src/main/java/host/exp/exponent/experience/MultipleVersionReactNativeActivity.java');
  const expoviewConstantsPath = path.join(expoviewPath, 'src/main/java/host/exp/exponent/Constants.java');
  const testSuiteTestsPath = path.join(appPath, 'src/androidTest/java/host/exp/exponent/TestSuiteTests.java');

  return {
    androidPath,
    appPath,
    expoviewPath,
    versionedExpoviewAbiPath,
    expoviewBuildGradlePath,
    appManifestPath,
    templateManifestPath,
    settingsGradlePath,
    appBuildGradlePath,
    buildGradlePath,
    sdkVersionsPath,
    rnActivityPath,
    expoviewConstantsPath,
    testSuiteTestsPath,
  };
}

async function transformFileAsync(filePath: string, regexp: RegExp, replacement: string = '') {
  const fileContent = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(filePath, fileContent.replace(regexp, replacement));
}

async function removeVersionReferencesFromFileAsync(sdkMajorVersion: string, filePath: string) {
  console.log(
    `Removing code surrounded by ${chalk.gray(`// BEGIN_SDK_${sdkMajorVersion}`)} and ${chalk.gray(`// END_SDK_${sdkMajorVersion}`)} from ${chalk.magenta(path.relative(EXPO_DIR, filePath))}...`
  );
  await transformFileAsync(
    filePath,
    new RegExp(`\\s*//\\s*BEGIN_SDK_${sdkMajorVersion}(_\d+)*\\n.*?//\\s*END_SDK_${sdkMajorVersion}(_\d+)*`, 'gs'),
    '',
  );
}

async function removeVersionedExpoviewAsync(versionedExpoviewAbiPath: string) {
  console.log(`Removing versioned expoview at ${chalk.magenta(path.relative(EXPO_DIR, versionedExpoviewAbiPath))}...`);
  await fs.remove(versionedExpoviewAbiPath);
}

async function removeFromManifestAsync(sdkMajorVersion: string, manifestPath: string) {
  console.log(
    `Removing code surrounded by ${chalk.gray(`<!-- BEGIN_SDK_${sdkMajorVersion} -->`)} and ${chalk.gray(`<!-- END_SDK_${sdkMajorVersion} -->`)} from ${chalk.magenta(path.relative(EXPO_DIR, manifestPath))}...`
  );
  await transformFileAsync(
    manifestPath,
    new RegExp(`\\s*<!--\\s*BEGIN_SDK_${sdkMajorVersion}(_\d+)*\\s*-->.*?<!--\\s*END_SDK_${sdkMajorVersion}(_\d+)*\\s*-->`, 'gs'),
    '',
  );
}

async function removeFromSettingsGradleAsync(abiName: string, settingsGradlePath: string) {
  console.log(
    `Removing ${chalk.green(`expoview-${abiName}`)} from ${chalk.magenta(path.relative(EXPO_DIR, settingsGradlePath))}...`
  );
  await transformFileAsync(
    settingsGradlePath,
    new RegExp(`\\n\\s*"${abiName}",[^\\n]*`, 'g'),
    '',
  );
}

async function removeFromBuildGradleAsync(abiName: string, buildGradlePath: string) {
  console.log(
    `Removing maven repository for ${chalk.green(`expoview-${abiName}`)} from ${chalk.magenta(path.relative(EXPO_DIR, buildGradlePath))}...`
  );
  await transformFileAsync(
    buildGradlePath,
    new RegExp(`\\s*maven\\s*{\\s*url\\s*".*?/expoview-${abiName}/maven"\\s*}[^\\n]*`),
    '',
  );
}

async function removeFromSdkVersionsAsync(version: string, sdkVersionsPath: string) {
  console.log(
    `Removing ${chalk.cyan(version)} from ${chalk.magenta(path.relative(EXPO_DIR, sdkVersionsPath))}...`
  );
  await transformFileAsync(
    sdkVersionsPath,
    new RegExp(`"${version}",\s*`, 'g'),
    '',
  );
}

async function removeTestSuiteTestsAsync(version: string, testsFilePath: string) {
  console.log(
    `Removing test-suite tests from ${chalk.magenta(path.relative(EXPO_DIR, testsFilePath))}...`
  );
  await transformFileAsync(
    testsFilePath,
    new RegExp(`\\s*(@\\w+\\s+)*@ExpoSdkVersionTest("${version}")[^}]+}`),
    '',
  );
}

async function findVersionReferencesInSourceFilesAsync(version: string, directories: string[]): Promise<boolean> {
  const pattern = `(${version.replace(/\./g, '[._]')}|(SDK|ABI).?${semver.major(version)})`;
  let matchesCount = 0;

  for (const directory of directories) {
    const results = await find({ term: pattern, flags: 'ig' }, directory, '\\.(java|kt|xml|gradle)$');
    const keys = Object.keys(results);
  
    for (const key of keys) {
      const result = results[key];
      const fileContent = await fs.readFile(key, 'utf8');
      const fileLines = fileContent.split(/\r\n?|\n/g);

      matchesCount += result.count;
  
      result.matches.forEach((match, index) => {
        const line = result.line[index];
        const lineNumberWithMatch = fileLines.indexOf(line);
        const firstLineInContext = Math.max(0, lineNumberWithMatch - 2);
        const lastLineInContext = Math.min(lineNumberWithMatch + 2, fileLines.length);
  
        console.log(
          `Found ${chalk.bold.green(match)} in ${chalk.magenta(path.relative(EXPO_DIR, key))}:`,
        );
  
        for (let lineIndex = firstLineInContext; lineIndex <= lastLineInContext; lineIndex++) {
          console.log(
            `${chalk.gray(1 + lineIndex + ':')} ${fileLines[lineIndex].replace(match, chalk.bgMagenta(match))}`,
          );
        }
        console.log();
      });
    }
  }
  return matchesCount > 0;
}

export async function removeVersionAsync(version: string) {
  const abiName = `abi${version.replace(/\./g, '_')}`;
  const paths = getProjectPaths(abiName);
  const sdkMajorVersion = semver.major(version);

  console.log(`Removing SDK version ${chalk.cyan(version)} for ${chalk.blue('Android')}...`);

  // Remove expoview-abi*_0_0 library
  await removeVersionedExpoviewAsync(paths.versionedExpoviewAbiPath);
  await removeFromSettingsGradleAsync(abiName, paths.settingsGradlePath);
  await removeFromBuildGradleAsync(abiName, paths.buildGradlePath);
  
  // Remove code surrounded by BEGIN_SDK_* and END_SDK_*
  await removeVersionReferencesFromFileAsync(sdkMajorVersion, paths.expoviewBuildGradlePath);
  await removeVersionReferencesFromFileAsync(sdkMajorVersion, paths.appBuildGradlePath);
  await removeVersionReferencesFromFileAsync(sdkMajorVersion, paths.rnActivityPath);
  await removeVersionReferencesFromFileAsync(sdkMajorVersion, paths.expoviewConstantsPath);

  // Remove test-suite tests from the app.
  await removeTestSuiteTestsAsync(version, paths.testSuiteTestsPath);

  // Update AndroidManifests
  await removeFromManifestAsync(sdkMajorVersion, paths.appManifestPath);
  await removeFromManifestAsync(sdkMajorVersion, paths.templateManifestPath);

  // Remove SDK version from the list of supported SDKs
  await removeFromSdkVersionsAsync(version, paths.sdkVersionsPath);

  console.log(
    `\nLooking for SDK references in source files...`
  );

  const sourceFilesDirs = [
    path.join(paths.appPath, 'src', 'main'),
    path.join(paths.expoviewPath, 'src', 'main'),
  ];

  if (await findVersionReferencesInSourceFilesAsync(version, sourceFilesDirs)) {
    console.log(
      chalk.yellow(`Please review all of these references and remove them manually if possible!\n`),
    );
  }
}
