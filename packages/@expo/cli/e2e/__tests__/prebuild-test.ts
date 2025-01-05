/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';

import {
  projectRoot,
  getRoot,
  setupTestProjectWithOptionsAsync,
  getLoadedModulesAsync,
  findProjectFiles,
} from './utils';
import { executeExpoAsync } from '../utils/expo';
import { createPackageTarball } from '../utils/package';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

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
  const results = await executeExpoAsync(projectRoot, ['prebuild', '--help']);
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
        --bun                                    Use bun to install dependencies. Default when bun.lock or bun.lockb exists
        --pnpm                                   Use pnpm to install dependencies. Default when pnpm-lock.yaml exists
        --template <template>                    Project template to clone from. File path pointing to a local tar file, npm package or a github repo
        -p, --platform <all|android|ios>         Platforms to sync: ios, android, all. Default: all
        --skip-dependency-update <dependencies>  Preserves versions of listed packages in package.json (comma separated list)
        -h, --help                               Usage info
    "
  `);
});

it('runs `npx expo prebuild` asserts when expo is not installed', async () => {
  const projectRoot = getRoot('basic-prebuild-assert-no-expo');

  // Create the project root aot
  await fs.mkdir(projectRoot, { recursive: true });
  // Create a fake package.json -- this is a terminal file that cannot be overwritten.
  await fs.writeFile(path.join(projectRoot, 'package.json'), '{ "version": "1.0.0" }');
  await fs.writeFile(path.join(projectRoot, 'app.json'), '{ "expo": { "name": "foobar" } }');

  await expect(
    executeExpoAsync(projectRoot, ['prebuild', '--no-install'], { verbose: false })
  ).rejects.toThrow(
    /Cannot determine which native SDK version your project uses because the module `expo` is not installed\. Please install it with `yarn add expo` and try again./
  );
});

/**
 * Asserts that the placeholder values for the app name have been renamed to the
 * values configured by the user
 *
 * @see packages/create-expo/README.md for an explanation of placeholder values.
 */
async function expectTemplateAppNameToHaveBeenRenamed(projectRoot: string) {
  // We could read the files in parallel to save a tiny bit of time, but the
  // test code and stack trace is far easier to follow when arranged like this.
  const read = (filePath: string) => fs.readFile(path.resolve(projectRoot, filePath), 'utf-8');
  let contents: string;

  // For each of these tests, we provide both positive and negative test cases.
  // - We expect it *not to match* the template's initial value.
  //   - … This guards against renaming some, but not all cases of the string.
  // - We expect it *to match* the renamed value configured by the user.
  //   - … This guards against renaming the string, but to the wrong value.

  contents = await read('app.json');
  expect(contents).not.toMatch('HelloWorld');
  expect(contents).toMatch('com.example.minimal');

  contents = await read('android/settings.gradle');
  expect(contents).not.toMatch('HelloWorld');
  expect(contents).toMatch('basic-prebuild');

  // Although renameTemplateAppName() renames to "com.basicprebuild"
  // post-extraction, there seems to be a follow-up step that (correctly)
  // renames it once again to the value configured in `exp.android.package`.
  contents = await read('android/app/build.gradle');
  expect(contents).not.toMatch('com.helloworld');
  expect(contents).toMatch('com.example.minimal');

  contents = await read('android/app/src/main/java/com/example/minimal/MainApplication.kt');
  expect(contents).not.toMatch('com.helloworld');
  expect(contents).toMatch('com.example.minimal');

  contents = await read('android/app/src/main/java/com/example/minimal/MainActivity.kt');
  expect(contents).not.toMatch('com.helloworld');
  expect(contents).toMatch('com.example.minimal');

  contents = await read('ios/Podfile');
  expect(contents).not.toMatch('HelloWorld');
  expect(contents).toMatch('basicprebuild');

  contents = await read('ios/basicprebuild.xcodeproj/project.pbxproj');
  expect(contents).not.toMatch('HelloWorld');
  expect(contents).toMatch('basicprebuild');

  contents = await read(
    'ios/basicprebuild.xcodeproj/xcshareddata/xcschemes/basicprebuild.xcscheme'
  );
  expect(contents).not.toMatch('HelloWorld');
  expect(contents).toMatch('basicprebuild');

  // In case this template ever changes in future, other typical files to look
  // out for include:
  // android/app/BUCK
  // android/app/src/main/AndroidManifest.xml
  // android/app/src/main/res/values/strings.xml
  // android/app/src/debug/java/com/minimal/ReactNativeFlipper.java
  // android/app/src/main/java/com/minimal/MainActivity.java
  // android/app/src/main/java/com/minimal/MainApplication.java
}

// This tests contains assertions related to ios files, making it incompatible with Windows
itNotWindows('runs `npx expo prebuild`', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('basic-prebuild', 'with-blank', {
    reuseExisting: false,
  });

  const templateTarball = await createPackageTarball(
    projectRoot,
    'templates/expo-template-bare-minimum'
  );

  await executeExpoAsync(projectRoot, [
    'prebuild',
    '--no-install',
    '--template',
    templateTarball.relativePath,
  ]);

  // Clean up the tarballs to avoid `.tarballs` being validated
  await fs.rm(path.dirname(templateTarball.absolutePath), { force: true, recursive: true });

  const pkg = await JsonFile.readAsync(path.resolve(projectRoot, 'package.json'));

  await expectTemplateAppNameToHaveBeenRenamed(projectRoot);

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
  expect(findProjectFiles(projectRoot)).toMatchSnapshot();
});

// This tests contains assertions related to ios files, making it incompatible with Windows
itNotWindows('runs `npx expo prebuild --template expo-template-bare-minimum@50.0.43`', async () => {
  const npmTemplatePackage = 'expo-template-bare-minimum@50.0.43';
  const projectRoot = await setupTestProjectWithOptionsAsync('basic-prebuild', 'with-blank', {
    reuseExisting: false,
  });
  const pkg = new JsonFile(path.resolve(projectRoot, 'package.json'));

  await executeExpoAsync(projectRoot, [
    'prebuild',
    '--no-install',
    '--template',
    npmTemplatePackage,
  ]);

  await expectTemplateAppNameToHaveBeenRenamed(projectRoot);

  // Added new packages
  expect(pkg.read().dependencies).toMatchObject({
    expo: expect.any(String),
    react: expect.any(String),
    'react-native': expect.any(String),
  });

  // Updated scripts
  expect(pkg.read().scripts).toMatchObject({
    android: 'expo run:android',
    ios: 'expo run:ios',
  });

  // If this changes then everything else probably changed as well.
  expect(findProjectFiles(projectRoot)).toMatchSnapshot();
});

// This tests contains assertions related to ios files, making it incompatible with Windows
itNotWindows('runs `npx expo prebuild --template <github-url>`', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync(
    'github-template-prebuild',
    'with-blank',
    { reuseExisting: false }
  );
  const pkg = new JsonFile(path.resolve(projectRoot, 'package.json'));

  const expoPackage = require(path.join(projectRoot, 'package.json')).dependencies.expo;
  const expoSdkVersion = semver.minVersion(expoPackage)?.major;
  if (!expoSdkVersion) {
    throw new Error('Could not determine Expo SDK major version from template');
  }

  const templateUrl = `https://github.com/expo/expo/tree/sdk-${expoSdkVersion}/templates/expo-template-bare-minimum`;

  await executeExpoAsync(projectRoot, ['prebuild', '--no-install', '--template', templateUrl]);

  // Added new packages
  expect(pkg.read().dependencies).toMatchObject({
    expo: expect.any(String),
    react: expect.any(String),
    'react-native': expect.any(String),
  });

  // Updated scripts
  expect(pkg.read().scripts).toMatchObject({
    android: 'expo run:android',
    ios: 'expo run:ios',
  });

  // If this changes then everything else probably changed as well.
  expect(findProjectFiles(projectRoot)).toMatchSnapshot();
});
