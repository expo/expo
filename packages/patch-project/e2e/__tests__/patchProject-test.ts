/* eslint-env jest */
import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';
import rimraf from 'rimraf';

import { addLinkedPackagesAsync, packBareTemplateTarballAsync } from './localPackages';
const localExpoCli = path.join(__dirname, '../../../@expo/cli/build/bin/cli');

const originalCI = process.env.CI;

describe('patch-project', () => {
  jest.setTimeout(600000);
  const tmpDir = require('temp-dir');
  const projectName = 'patch-project-test';
  const projectRoot = path.join(tmpDir, projectName);
  let templateTarball;

  beforeAll(async () => {
    process.env.CI = '1';
    rimraf.sync(projectRoot);
    await await spawnAsync('bunx', ['create-expo-app', '-t', 'blank', projectName], {
      stdio: 'inherit',
      cwd: tmpDir,
      env: {
        ...process.env,
        // Do not inherit the package manager from this repository
        npm_config_user_agent: undefined,
      },
    });

    // Setup appId
    const appConfigPath = path.join(projectRoot, 'app.json');
    let appConfigContents = await fs.readFile(appConfigPath, 'utf8');
    const appConfig = JSON.parse(appConfigContents);
    appConfig.expo.android.package = 'com.expo.test';
    appConfig.expo.ios.bundleIdentifier = 'com.expo.test';
    appConfig.expo.runtimeVersion = {
      policy: 'appVersion',
    };
    appConfigContents = JSON.stringify(appConfig, null, 2);
    await fs.writeFile(appConfigPath, appConfigContents, 'utf8');

    // Add local packages
    await addLinkedPackagesAsync(projectRoot, ['patch-project']);

    // Create a tarball of the local template
    templateTarball = await packBareTemplateTarballAsync(projectRoot);
  });

  afterAll(async () => {
    process.env.CI = originalCI;
    rimraf.sync(projectRoot);
  });

  it('runs `patch-project` should convert a project to CNG patches`', async () => {
    await fs.rm(path.join(projectRoot, 'cng-patches'), { recursive: true, force: true });

    await spawnAsync(
      'node',
      [
        localExpoCli,
        'prebuild',
        '--platform',
        'android',
        '--clean',
        '--no-install',
        '--template',
        templateTarball,
      ],
      {
        cwd: projectRoot,
      }
    );

    // Do some manual changes
    const appGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
    let contents = await fs.readFile(appGradlePath, 'utf8');
    contents = contents.replace('org.webkit:android-jsc:+', 'org.webkit:android-jsc-intl:+');
    await fs.writeFile(appGradlePath, contents, 'utf8');

    await spawnAsync(
      'bunx',
      ['patch-project', '--clean', '--platform', 'android', '--template', templateTarball],
      {
        cwd: projectRoot,
      }
    );

    let androidDirExists;
    try {
      await fs.stat(path.join(projectRoot, 'android'));
      androidDirExists = true;
    } catch {
      androidDirExists = false;
    }
    expect(androidDirExists).toBe(false);

    // Assume the first patch is the android patch
    const patchFiles = await fs.readdir(path.join(projectRoot, 'cng-patches'));
    const patchContents = await fs.readFile(
      path.join(projectRoot, 'cng-patches', patchFiles[0]),
      'utf8'
    );
    expect(patchContents).toMatch(`\
-def jscFlavor = 'org.webkit:android-jsc:+'
+def jscFlavor = 'org.webkit:android-jsc-intl:+'`);
  });

  it('runs `patch-project` should convert a project to CNG patches` and `npx expo prebuild` should apply the patches', async () => {
    await fs.rm(path.join(projectRoot, 'cng-patches'), { recursive: true, force: true });

    await spawnAsync(
      'node',
      [
        localExpoCli,
        'prebuild',
        '--platform',
        'android',
        '--clean',
        '--no-install',
        '--template',
        templateTarball,
      ],
      {
        cwd: projectRoot,
      }
    );

    // Do some manual changes
    const appGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
    const contents = await fs.readFile(appGradlePath, 'utf8');
    const patchedContents = contents.replace(
      'org.webkit:android-jsc:+',
      'org.webkit:android-jsc-intl:+'
    );
    await fs.writeFile(appGradlePath, patchedContents, 'utf8');

    await spawnAsync(
      'bunx',
      ['patch-project', '--clean', '--platform', 'android', '--template', templateTarball],
      {
        cwd: projectRoot,
      }
    );

    // Use the withPatchPlugin
    let appConfigContents = await fs.readFile(path.join(projectRoot, 'app.json'), 'utf8');
    const appConfig = JSON.parse(appConfigContents);
    appConfig.expo.plugins = ['patch-project'];
    appConfigContents = JSON.stringify(appConfig, null, 2);
    await fs.writeFile(path.join(projectRoot, 'app.json'), appConfigContents, 'utf8');

    await spawnAsync(
      'node',
      [
        localExpoCli,
        'prebuild',
        '--platform',
        'android',
        '--no-install',
        '--template',
        templateTarball,
      ],
      {
        cwd: projectRoot,
      }
    );

    const contents2 = await fs.readFile(appGradlePath, 'utf8');
    expect(contents2).toBe(patchedContents);
  });
});
