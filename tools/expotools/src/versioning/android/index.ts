import chalk from 'chalk';
import fs from 'fs-extra';
import glob from 'glob-promise';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';
import spawnAsync from '@expo/spawn-async';

import { JniLibNames, getJavaPackagesToRename } from './libraries';
import * as Directories from '../../Directories';
import { getListOfPackagesAsync } from '../../Packages';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const ANDROID_DIR = Directories.getAndroidDir();
const EXPOTOOLS_DIR = Directories.getExpotoolsDir();
const SCRIPT_DIR = path.join(EXPOTOOLS_DIR, 'src/versioning/android');

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
const reactAndroidPath = path.join(ANDROID_DIR, 'ReactAndroid');
const reactCommonPath = path.join(ANDROID_DIR, 'ReactCommon');
const versionedReactAndroidPath = path.join(ANDROID_DIR, 'versioned-react-native/ReactAndroid');
const versionedReactAndroidJniPath = path.join(versionedReactAndroidPath, 'src/main');
const versionedReactAndroidJavaPath = path.join(versionedReactAndroidJniPath, 'java');
const versionedReactCommonPath = path.join(ANDROID_DIR, 'versioned-react-native/ReactCommon');

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

function renameLib(lib: string, abiVersion: string) {
  for (let i = 0; i < JniLibNames.length; i++) {
    if (lib.endsWith(JniLibNames[i])) {
      return `${lib}_abi${abiVersion}`;
    }
  }

  return lib;
}

function processLine(line: string, abiVersion: string) {
  if (
    line.startsWith('LOCAL_MODULE') ||
    line.startsWith('LOCAL_SHARED_LIBRARIES') ||
    line.startsWith('LOCAL_STATIC_LIBRARIES')
  ) {
    let splitLine = line.split(':=');
    let libs = splitLine[1].split(' ');
    for (let i = 0; i < libs.length; i++) {
      libs[i] = renameLib(libs[i], abiVersion);
    }
    splitLine[1] = libs.join(' ');
    line = splitLine.join(':=');
  }

  return line;
}

async function processMkFileAsync(filename: string, abiVersion: string) {
  let file = await fs.readFile(filename);
  let fileString = file.toString();
  await fs.truncate(filename, 0);
  let lines = fileString.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = processLine(line, abiVersion);
    await fs.appendFile(filename, `${line}\n`);
  }
}

async function processJavaCodeAsync(libName: string, abiVersion: string) {
  return spawnAsync(
    `find ${versionedReactAndroidJavaPath} -iname '*.java' -type f -print0 | ` +
    `xargs -0 sed -i '' 's/"${libName}"/"${libName}_abi${abiVersion}"/g'`,
    [],
    { shell: true }
  );
}

async function updateVersionedReactNativeAsync() {
  await fs.remove(versionedReactAndroidPath);
  await fs.remove(versionedReactCommonPath);
  await fs.copy(reactAndroidPath, versionedReactAndroidPath);
  await fs.copy(reactCommonPath, versionedReactCommonPath);
}

async function renameJniLibsAsync(version: string) {
  const abiVersion = version.replace(/\./g, '_');

  // Update JNI methods
  const packagesToRename = await getJavaPackagesToRename();
  for (const javaPackage of packagesToRename) {
    const pathForPackage = javaPackage.replace(/\./g, '\\/');
    await spawnAsync(
      `find ${versionedReactCommonPath} ${versionedReactAndroidJniPath} -type f ` +
      `\\( -name \*.java -o -name \*.h -o -name \*.cpp -o -name \*.mk \\) -print0 | ` +
      `xargs -0 sed -i '' 's/${pathForPackage}/abi${abiVersion}\\/${pathForPackage}/g'`,
      [],
      { shell: true }
    );
  }

  // Update LOCAL_MODULE, LOCAL_SHARED_LIBRARIES, LOCAL_STATIC_LIBRARIES fields in .mk files
  let [reactCommonMkFiles, reactAndroidMkFiles] = await Promise.all([
    glob(path.join(versionedReactCommonPath, '**/*.mk')),
    glob(path.join(versionedReactAndroidJniPath, '**/*.mk')),
  ]);
  let filenames = [...reactCommonMkFiles, ...reactAndroidMkFiles];
  await Promise.all(filenames.map(filename => processMkFileAsync(filename, abiVersion)));

  // Rename references to JNI libs in Java code
  for (let i = 0; i < JniLibNames.length; i++) {
    let libName = JniLibNames[i];
    await processJavaCodeAsync(libName, abiVersion);
  }

  // 'fbjni' is loaded without the 'lib' prefix in com.facebook.jni.Prerequisites
  await processJavaCodeAsync('fbjni', abiVersion);
  await processJavaCodeAsync('fb', abiVersion);

  console.log('\nThese are the JNI lib names we modified:');
  await spawnAsync(
    `find ${versionedReactAndroidJavaPath} -name "*.java" | xargs grep -i "_abi${abiVersion}"`,
    [],
    { shell: true, stdio: 'inherit' }
  );

  console.log('\nAnd here are all instances of loadLibrary:');
  await spawnAsync(
    `find ${versionedReactAndroidJavaPath} -name "*.java" | xargs grep -i "loadLibrary"`,
    [],
    { shell: true, stdio: 'inherit' }
  );

  const { isCorrect } = await inquirer.prompt<{ isCorrect: boolean }>([
    {
      type: 'confirm',
      name: 'isCorrect',
      message: 'Does all that look correct?',
      default: false,
    },
  ]);
  if (!isCorrect) {
    throw new Error('Fix JNI libs');
  }
}

async function copyUnimodulesAsync(version: string) {
  const packages = await getListOfPackagesAsync();
  for (const pkg of packages) {
    if (
      pkg.isUnimodule &&
      pkg.isSupportedOnPlatform('android') &&
      pkg.isIncludedInExpoClientOnPlatform('android') &&
      pkg.isVersionableOnPlatform('android')
    ) {
      await spawnAsync(
        './android-copy-unimodule.sh',
        [version, path.join(pkg.path, pkg.androidSubdirectory)],
        {
          shell: true,
          cwd: SCRIPT_DIR,
        }
      );
      console.log(`   ✅  Created versioned ${pkg.packageName}`)
    }
  }
}

async function addVersionedActivitesToManifests(version: string) {
  const abiVersion = version.replace(/\./g, '_');
  const abiName = `abi${abiVersion}`;
  const majorVersion = semver.major(version);

  const versionedAndroidManifestPath = path.join(
    versionedExpoviewAbiPath(abiName),
    'src/main/AndroidManifest.xml'
  );

  await transformFileAsync(
    versionedAndroidManifestPath,
    new RegExp('<!-- ADD_VERSIONED_APP_AUTH_ACTIVITY_HERE -->'),
    `<activity
      android:name="${abiName}.expo.modules.appauth.AppAuthBrowserActivity"
      android:exported="false"
      android:launchMode="singleTask"
      android:theme="@android:style/Theme.Translucent.NoTitleBar"/>`
  );

  await transformFileAsync(
    templateManifestPath,
    new RegExp('<!-- ADD DEV SETTINGS HERE -->'),
    `<!-- ADD DEV SETTINGS HERE -->
    <!-- BEGIN_SDK_${majorVersion} -->
    <activity android:name="${abiName}.com.facebook.react.devsupport.DevSettingsActivity"/>
    <!-- END_SDK_${majorVersion} -->`
  );

  await transformFileAsync(
    templateManifestPath,
    new RegExp('<!-- Versioned Activity for Stripe -->'),
    `<!-- Versioned Activity for Stripe -->
    <!-- BEGIN_SDK_${majorVersion} -->
    <activity
      android:exported="true"
      android:launchMode="singleTask"
      android:name="${abiName}.expo.modules.payments.stripe.RedirectUriReceiver"
      android:theme="@android:style/Theme.Translucent.NoTitleBar.Fullscreen">
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="${abiName}.expo.modules.payments.stripe" />
      </intent-filter>
    </activity>
    <!-- END_SDK_${majorVersion} -->`
  );
}

async function cleanUpAsync(version: string) {
  const abiVersion = version.replace(/\./g, '_');
  const abiName = `abi${abiVersion}`;

  const versionedAbiSrcPath = path.join(
    versionedExpoviewAbiPath(abiName),
    'src/main/java',
    abiName
  );

  let filesToDelete: string[] = [];

  // delete PrintDocumentAdapter*Callback.java
  // their package is `android.print` and therefore they are not changed by the versioning script
  // so we will have duplicate classes
  const printCallbackFiles = await glob(path.join(
    versionedAbiSrcPath,
    'expo/modules/print/*Callback.java'
  ));
  for (const file of printCallbackFiles) {
    const contents = await fs.readFile(file, 'utf8');
    if (!contents.includes(`package ${abiName}`)) {
      filesToDelete.push(file);
    } else {
      console.log(`Skipping deleting ${file} because it appears to have been versioned`);
    }
  }

  // delete versioned loader providers since we don't need them
  filesToDelete.push(path.join(versionedAbiSrcPath, 'expo/loaders'));

  console.log('Deleting the following files and directories:');
  console.log(filesToDelete);

  for (const file of filesToDelete) {
    await fs.remove(file);
  }

  // misc fixes for versioned code
  const versionedExponentPackagePath = path.join(
    versionedAbiSrcPath,
    'host/exp/exponent/ExponentPackage.java'
  );
  await transformFileAsync(
    versionedExponentPackagePath,
    new RegExp('// WHEN_VERSIONING_REMOVE_FROM_HERE', 'g'),
    '/* WHEN_VERSIONING_REMOVE_FROM_HERE'
  );
  await transformFileAsync(
    versionedExponentPackagePath,
    new RegExp('// WHEN_VERSIONING_REMOVE_TO_HERE', 'g'),
    'WHEN_VERSIONING_REMOVE_TO_HERE */'
  );

  await transformFileAsync(
    path.join(versionedAbiSrcPath, 'host/exp/exponent/VersionedUtils.java'),
    new RegExp('// DO NOT EDIT THIS COMMENT - used by versioning scripts[^,]+,[^,]+,'),
    'null, null,'
  );

  await transformFileAsync(
    path.join(versionedAbiSrcPath, 'expo/modules/payments/stripe/PayFlow.java'),
    new RegExp('// ADD BUILDCONFIG IMPORT HERE'),
    `import ${abiName}.host.exp.expoview.BuildConfig;`
  );

  // replace abixx_x_x...R with abixx_x_x.host.exp.expoview.R
  await spawnAsync(
    `find ${versionedAbiSrcPath} -iname '*.java' -type f -print0 | ` +
    `xargs -0 sed -i '' 's/import ${abiName}\.[^;]*\.R;/import ${abiName}.host.exp.expoview.R;/g'`,
    [],
    { shell: true }
  );

  // add new versioned maven to build.gradle
  await transformFileAsync(
    buildGradlePath,
    new RegExp('// For old expoviews to work'),
    `// For old expoviews to work
    maven {
      url "$rootDir/versioned-abis/expoview-${abiName}/maven"
    }`
  );
}

export async function addVersionAsync(version: string) {
  console.log(' 🛠   1/7: Updating android/versioned-react-native...');
  await updateVersionedReactNativeAsync();
  console.log(' ✅  1/7: Finished\n\n');

  console.log(' 🛠   2/7: Renaming JNI libs in android/versioned-react-native...');
  await renameJniLibsAsync(version);
  console.log(' ✅  2/7: Finished\n\n');

  console.log(' 🛠   3/7: Building versioned ReactAndroid AAR...');
  await spawnAsync(
    './android-build-aar.sh',
    [version],
    {
      shell: true,
      cwd: SCRIPT_DIR,
      stdio: 'inherit',
    }
  );
  console.log(' ✅  3/7: Finished\n\n');

  console.log(' 🛠   4/7: Creating versioned expoview package...');
  await spawnAsync(
    './android-copy-expoview.sh',
    [version],
    {
      shell: true,
      cwd: SCRIPT_DIR,
    }
  );
  console.log(' ✅  4/7: Finished\n\n');

  console.log(' 🛠   5/7: Creating versioned unimodule packages...');
  await copyUnimodulesAsync(version);
  console.log(' ✅  5/7: Finished\n\n');

  console.log(' 🛠   6/7: Adding extra versioned activites to AndroidManifest...');
  await addVersionedActivitesToManifests(version);
  console.log(' ✅  6/7: Finished\n\n');

  console.log(' 🛠   7/7: Misc cleanup...');
  await cleanUpAsync(version);
  console.log(' ✅  7/7: Finished');
}
