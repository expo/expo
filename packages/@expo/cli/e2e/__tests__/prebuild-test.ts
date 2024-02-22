/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import fs from 'fs/promises';
import { sync as globSync } from 'glob';
import klawSync from 'klaw-sync';
import path from 'path';
import semver from 'semver';

import {
  bin,
  execute,
  projectRoot,
  getRoot,
  setupTestProjectAsync,
  getLoadedModulesAsync,
} from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

const templateFolder = path.join(__dirname, '../../../../../templates/expo-template-bare-minimum/');

function getTemplatePath() {
  const results = globSync(`*.tgz`, {
    absolute: true,
    cwd: templateFolder,
  });

  return results[0];
}

async function ensureTemplatePathAsync() {
  let templatePath = getTemplatePath();
  if (templatePath) return templatePath;
  await execa('npm', ['pack'], { cwd: templateFolder });

  templatePath = getTemplatePath();
  if (templatePath) return templatePath;

  throw new Error('Could not find template tarball');
}

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/prebuild').expoPrebuild`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/prebuild/index.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo prebuild --help`', async () => {
  const results = await execute('prebuild', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Create native iOS and Android project files for building natively

      Usage
        $ npx expo prebuild <dir>

      Options
        <dir>                                    Directory of the Expo project. Default: Current working directory
        --no-install                             Skip installing npm packages and CocoaPods
        --clean                                  Delete the native folders and regenerate them before applying changes
        --npm                                    Use npm to install dependencies. Default when package-lock.json exists
        --yarn                                   Use Yarn to install dependencies. Default when yarn.lock exists
        --bun                                    Use bun to install dependencies. Default when bun.lockb exists
        --pnpm                                   Use pnpm to install dependencies. Default when pnpm-lock.yaml exists
        --template <template>                    Project template to clone from. File path pointing to a local tar file or a github repo
        -p, --platform <all|android|ios>         Platforms to sync: ios, android, all. Default: all
        --skip-dependency-update <dependencies>  Preserves versions of listed packages in package.json (comma separated list)
        -h, --help                               Usage info
    "
  `);
});

it('runs `npx expo prebuild` asserts when expo is not installed', async () => {
  const projectName = 'basic-prebuild-assert-no-expo';
  const projectRoot = getRoot(projectName);
  // Create the project root aot
  await fs.mkdir(projectRoot, { recursive: true });
  // Create a fake package.json -- this is a terminal file that cannot be overwritten.
  await fs.writeFile(path.join(projectRoot, 'package.json'), '{ "version": "1.0.0" }');
  await fs.writeFile(path.join(projectRoot, 'app.json'), '{ "expo": { "name": "foobar" } }');

  await expect(execute('prebuild', projectName, '--no-install')).rejects.toThrowError(
    /Cannot determine which native SDK version your project uses because the module `expo` is not installed\. Please install it with `yarn add expo` and try again./
  );
});

it(
  'runs `npx expo prebuild`',
  async () => {
    const projectRoot = await setupTestProjectAsync('basic-prebuild', 'with-blank');

    const templateFolder = await ensureTemplatePathAsync();
    console.log('Using local template:', templateFolder);

    await execa('node', [bin, 'prebuild', '--no-install', '--template', templateFolder], {
      cwd: projectRoot,
    });

    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(projectRoot)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(projectRoot, entry.path);
      })
      .filter(Boolean);

    const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

    // Added new packages
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toStrictEqual([
      'expo',
      'react',
      'react-native',
    ]);

    // Updated scripts
    expect(pkg.scripts).toStrictEqual({
      android: 'expo run:android',
      ios: 'expo run:ios',
    });

    // If this changes then everything else probably changed as well.
    expect(files).toMatchInlineSnapshot(`
      [
        "App.js",
        "android/.gitignore",
        "android/app/build.gradle",
        "android/app/debug.keystore",
        "android/app/proguard-rules.pro",
        "android/app/src/debug/AndroidManifest.xml",
        "android/app/src/main/AndroidManifest.xml",
        "android/app/src/main/java/com/example/minimal/MainActivity.kt",
        "android/app/src/main/java/com/example/minimal/MainApplication.kt",
        "android/app/src/main/res/drawable/rn_edit_text_material.xml",
        "android/app/src/main/res/drawable/splashscreen.xml",
        "android/app/src/main/res/mipmap-hdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-mdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png",
        "android/app/src/main/res/values/colors.xml",
        "android/app/src/main/res/values/strings.xml",
        "android/app/src/main/res/values/styles.xml",
        "android/app/src/main/res/values-night/colors.xml",
        "android/build.gradle",
        "android/gradle/wrapper/gradle-wrapper.jar",
        "android/gradle/wrapper/gradle-wrapper.properties",
        "android/gradle.properties",
        "android/gradlew",
        "android/gradlew.bat",
        "android/settings.gradle",
        "app.json",
        "bun.lockb",
        "ios/.gitignore",
        "ios/.xcode.env",
        "ios/Podfile",
        "ios/Podfile.properties.json",
        "ios/basicprebuild/AppDelegate.h",
        "ios/basicprebuild/AppDelegate.mm",
        "ios/basicprebuild/Images.xcassets/AppIcon.appiconset/Contents.json",
        "ios/basicprebuild/Images.xcassets/Contents.json",
        "ios/basicprebuild/Images.xcassets/SplashScreenBackground.imageset/Contents.json",
        "ios/basicprebuild/Images.xcassets/SplashScreenBackground.imageset/image.png",
        "ios/basicprebuild/Info.plist",
        "ios/basicprebuild/SplashScreen.storyboard",
        "ios/basicprebuild/Supporting/Expo.plist",
        "ios/basicprebuild/basicprebuild-Bridging-Header.h",
        "ios/basicprebuild/basicprebuild.entitlements",
        "ios/basicprebuild/main.m",
        "ios/basicprebuild/noop-file.swift",
        "ios/basicprebuild.xcodeproj/project.pbxproj",
        "ios/basicprebuild.xcodeproj/project.xcworkspace/contents.xcworkspacedata",
        "ios/basicprebuild.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist",
        "ios/basicprebuild.xcodeproj/xcshareddata/xcschemes/basicprebuild.xcscheme",
        "package.json",
      ]
    `);
  },
  // Could take 45s depending on how fast npm installs
  60 * 1000
);

it(
  'runs `npx expo prebuild --template <github-url>`',
  async () => {
    const projectRoot = await setupTestProjectAsync('github-template-prebuild', 'with-blank');

    const expoPackage = require(path.join(projectRoot, 'package.json')).dependencies.expo;
    const expoSdkVersion = semver.minVersion(expoPackage)?.major;
    if (!expoSdkVersion) {
      throw new Error('Could not determine Expo SDK major version from template');
    }

    const templateUrl = `https://github.com/expo/expo/tree/sdk-${expoSdkVersion}/templates/expo-template-bare-minimum`;
    console.log('Using github template for SDK', expoSdkVersion, ':', templateUrl);

    await execa('node', [bin, 'prebuild', '--no-install', '--template', templateUrl], {
      cwd: projectRoot,
    });

    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(projectRoot)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(projectRoot, entry.path);
      })
      .filter(Boolean);

    const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

    // Added new packages
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toStrictEqual([
      'expo',
      'react',
      'react-native',
    ]);

    // Updated scripts
    expect(pkg.scripts).toStrictEqual({
      android: 'expo run:android',
      ios: 'expo run:ios',
    });

    // If this changes then everything else probably changed as well.
    expect(files).toMatchInlineSnapshot(`
      [
        "App.js",
        "android/.gitignore",
        "android/app/build.gradle",
        "android/app/debug.keystore",
        "android/app/proguard-rules.pro",
        "android/app/src/debug/AndroidManifest.xml",
        "android/app/src/debug/java/com/example/minimal/ReactNativeFlipper.java",
        "android/app/src/main/AndroidManifest.xml",
        "android/app/src/main/java/com/example/minimal/MainActivity.java",
        "android/app/src/main/java/com/example/minimal/MainApplication.java",
        "android/app/src/main/res/drawable/rn_edit_text_material.xml",
        "android/app/src/main/res/drawable/splashscreen.xml",
        "android/app/src/main/res/mipmap-hdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-mdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png",
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
        "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png",
        "android/app/src/main/res/values/colors.xml",
        "android/app/src/main/res/values/strings.xml",
        "android/app/src/main/res/values/styles.xml",
        "android/app/src/main/res/values-night/colors.xml",
        "android/app/src/release/java/com/example/minimal/ReactNativeFlipper.java",
        "android/build.gradle",
        "android/gradle/wrapper/gradle-wrapper.jar",
        "android/gradle/wrapper/gradle-wrapper.properties",
        "android/gradle.properties",
        "android/gradlew",
        "android/gradlew.bat",
        "android/settings.gradle",
        "app.json",
        "bun.lockb",
        "ios/.gitignore",
        "ios/.xcode.env",
        "ios/Podfile",
        "ios/Podfile.properties.json",
        "ios/githubtemplateprebuild/AppDelegate.h",
        "ios/githubtemplateprebuild/AppDelegate.mm",
        "ios/githubtemplateprebuild/Images.xcassets/AppIcon.appiconset/Contents.json",
        "ios/githubtemplateprebuild/Images.xcassets/Contents.json",
        "ios/githubtemplateprebuild/Images.xcassets/SplashScreenBackground.imageset/Contents.json",
        "ios/githubtemplateprebuild/Images.xcassets/SplashScreenBackground.imageset/image.png",
        "ios/githubtemplateprebuild/Info.plist",
        "ios/githubtemplateprebuild/SplashScreen.storyboard",
        "ios/githubtemplateprebuild/Supporting/Expo.plist",
        "ios/githubtemplateprebuild/githubtemplateprebuild-Bridging-Header.h",
        "ios/githubtemplateprebuild/githubtemplateprebuild.entitlements",
        "ios/githubtemplateprebuild/main.m",
        "ios/githubtemplateprebuild/noop-file.swift",
        "ios/githubtemplateprebuild.xcodeproj/project.pbxproj",
        "ios/githubtemplateprebuild.xcodeproj/project.xcworkspace/contents.xcworkspacedata",
        "ios/githubtemplateprebuild.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist",
        "ios/githubtemplateprebuild.xcodeproj/xcshareddata/xcschemes/githubtemplateprebuild.xcscheme",
        "package.json",
      ]
    `);
  },
  // Could take 1-2m depending on how fast github returns the tarball of expo/expo
  2 * 60 * 1000
);
