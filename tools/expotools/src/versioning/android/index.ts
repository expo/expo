import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import semver from 'semver';
import glob from 'glob-promise';

import { getExpoRepositoryRootDir, getAndroidDir } from '../../Directories';

const EXPO_DIR = getExpoRepositoryRootDir();
const ANDROID_DIR = getAndroidDir();

const appPath = path.join(ANDROID_DIR, 'app');
const expoviewPath = path.join(ANDROID_DIR, 'expoview');
const versionedAbisPath = path.join(ANDROID_DIR, 'versioned-abis');
const versionedExpoviewAbiPath = abiName => path.join(versionedAbisPath, `expoview-${abiName}`);
const expoviewBuildGradlePath = path.join(expoviewPath, 'build.gradle');
const appManifestPath = path.join(appPath, 'src', 'main', 'AndroidManifest.xml');
const templateManifestPath = path.join(EXPO_DIR, 'template-files', 'android', 'AndroidManifest.xml');
const settingsGradlePath = path.join(ANDROID_DIR, 'settings.gradle');
const appBuildGradlePath = path.join(appPath, 'build.gradle');
const buildGradlePath = path.join(ANDROID_DIR, 'build.gradle');
const sdkVersionsPath = path.join(ANDROID_DIR, 'sdkVersions.json');
const rnActivityPath = path.join(expoviewPath, 'src/main/java/host/exp/exponent/experience/MultipleVersionReactNativeActivity.java');
const expoviewConstantsPath = path.join(expoviewPath, 'src/main/java/host/exp/exponent/Constants.java');
const testSuiteTestsPath = path.join(appPath, 'src/androidTest/java/host/exp/exponent/TestSuiteTests.java');

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
    new RegExp(`\\s*(@\\w+\\s+)*@ExpoSdkVersionTest\\("${version}"\\)[^}]+}`),
    '',
  );
}

async function findAndPrintVersionReferencesInSourceFilesAsync(version: string): Promise<boolean> {
  const pattern = new RegExp(`(${version.replace(/\./g, '[._]')}|(SDK|ABI).?${semver.major(version)})`, 'ig');
  let matchesCount = 0;

  const files = await glob('**/{src/**/*.@(java|kt|xml),build.gradle}', { cwd: ANDROID_DIR });

  for (const file of files) {
    const filePath = path.join(ANDROID_DIR, file);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const fileLines = fileContent.split(/\r\n?|\n/g);
    let match;

    while ((match = pattern.exec(fileContent)) != null) {
      const index = pattern.lastIndex - match[0].length;
      const lineNumberWithMatch = fileContent.substring(0, index).split(/\r\n?|\n/g).length - 1;
      const firstLineInContext = Math.max(0, lineNumberWithMatch - 2);
      const lastLineInContext = Math.min(lineNumberWithMatch + 2, fileLines.length);

      ++matchesCount;

      console.log(
        `Found ${chalk.bold.green(match[0])} in ${chalk.magenta(path.relative(EXPO_DIR, filePath))}:`,
      );

      for (let lineIndex = firstLineInContext; lineIndex <= lastLineInContext; lineIndex++) {
        console.log(
          `${chalk.gray(1 + lineIndex + ':')} ${fileLines[lineIndex].replace(match[0], chalk.bgMagenta(match[0]))}`,
        );
      }
      console.log();
    }
  }
  return matchesCount > 0;
}

export async function removeVersionAsync(version: string) {
  const abiName = `abi${version.replace(/\./g, '_')}`;
  const sdkMajorVersion = semver.major(version);

  console.log(`Removing SDK version ${chalk.cyan(version)} for ${chalk.blue('Android')}...`);

  // Remove expoview-abi*_0_0 library
  await removeVersionedExpoviewAsync(versionedExpoviewAbiPath(abiName));
  await removeFromSettingsGradleAsync(abiName, settingsGradlePath);
  await removeFromBuildGradleAsync(abiName, buildGradlePath);
  
  // Remove code surrounded by BEGIN_SDK_* and END_SDK_*
  await removeVersionReferencesFromFileAsync(sdkMajorVersion, expoviewBuildGradlePath);
  await removeVersionReferencesFromFileAsync(sdkMajorVersion, appBuildGradlePath);
  await removeVersionReferencesFromFileAsync(sdkMajorVersion, rnActivityPath);
  await removeVersionReferencesFromFileAsync(sdkMajorVersion, expoviewConstantsPath);

  // Remove test-suite tests from the app.
  await removeTestSuiteTestsAsync(version, testSuiteTestsPath);

  // Update AndroidManifests
  await removeFromManifestAsync(sdkMajorVersion, appManifestPath);
  await removeFromManifestAsync(sdkMajorVersion, templateManifestPath);

  // Remove SDK version from the list of supported SDKs
  await removeFromSdkVersionsAsync(version, sdkVersionsPath);

  console.log(
    `\nLooking for SDK references in source files...`
  );

  if (await findAndPrintVersionReferencesInSourceFilesAsync(version)) {
    console.log(
      chalk.yellow(`Please review all of these references and remove them manually if possible!\n`),
    );
  }
}
