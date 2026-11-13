/**
 * expo-modules-jsi's custom build runs with EXPO_CUSTOM_BUILD_ROOT, both here (CustomBuild.ts) and
 * from a SwiftPM app's build phase inside node_modules. Its generated `jsi` module map must then
 * live under that root: the package directory may be read-only or shared by several build folders.
 */
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import os from 'os';
import path from 'path';

import { getPackagesDir } from '../Directories';

const JSI_APPLE_DIR = path.join(getPackagesDir(), 'expo-modules-jsi', 'apple');

const appleToolsOnly = {
  skip: process.platform !== 'darwin' && 'needs swift, which only macOS provides here',
};

describe('expo-modules-jsi generated module map', appleToolsOnly, () => {
  let tmpDir: string;
  let packageDir: string;
  let podsRoot: string;
  let buildRoot: string;

  beforeEach(async () => {
    tmpDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'jsi-modulemap-')));
    packageDir = path.join(tmpDir, 'apple');
    podsRoot = path.join(tmpDir, 'Pods');
    buildRoot = path.join(tmpDir, 'custom-build');
    await fs.copy(
      path.join(JSI_APPLE_DIR, 'scripts', 'generate-modulemap.sh'),
      path.join(packageDir, 'scripts', 'generate-modulemap.sh')
    );
    await fs.copy(
      path.join(JSI_APPLE_DIR, 'Package.swift'),
      path.join(packageDir, 'Package.swift')
    );
    const jsiHeaders = path.join(podsRoot, 'Headers', 'Public', 'React-jsi', 'jsi');
    await fs.outputFile(path.join(jsiHeaders, 'jsi.h'), '');
    await fs.outputFile(path.join(jsiHeaders, 'instrumentation.h'), '');
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  const generateModuleMapAsync = (env: NodeJS.ProcessEnv) =>
    spawnAsync(path.join(packageDir, 'scripts', 'generate-modulemap.sh'), [], {
      env: { PATH: process.env.PATH, PODS_ROOT: podsRoot, ...env },
    });

  async function manifestModuleMapAsync(env: NodeJS.ProcessEnv): Promise<string> {
    const { stdout } = await spawnAsync(
      'swift',
      ['package', 'dump-package', '--package-path', packageDir],
      { env: { PATH: process.env.PATH, HOME: process.env.HOME, PODS_ROOT: podsRoot, ...env } }
    );
    const flag = stdout.match(/-fmodule-map-file=([^"]+)/);
    assert.ok(flag, 'Package.swift passes no -fmodule-map-file flag');
    return flag[1];
  }

  it('writes the module map under EXPO_CUSTOM_BUILD_ROOT and nothing under the package', async () => {
    await generateModuleMapAsync({ EXPO_CUSTOM_BUILD_ROOT: buildRoot });

    const moduleMap = await fs.readFile(
      path.join(buildRoot, '.generated', 'module.modulemap'),
      'utf8'
    );
    assert.match(moduleMap, new RegExp(`header "${podsRoot}/Headers/Public/React-jsi/jsi/jsi.h"`));
    assert.equal(fs.existsSync(path.join(packageDir, '.generated')), false);
  });

  it('writes the module map next to the package when EXPO_CUSTOM_BUILD_ROOT is unset', async () => {
    await generateModuleMapAsync({});

    assert.ok(fs.existsSync(path.join(packageDir, '.generated', 'module.modulemap')));
  });

  it('reads the module map from EXPO_CUSTOM_BUILD_ROOT in Package.swift', async () => {
    assert.equal(
      await manifestModuleMapAsync({ EXPO_CUSTOM_BUILD_ROOT: buildRoot }),
      path.join(buildRoot, '.generated', 'module.modulemap')
    );
  });

  it('reads the module map next to the package in Package.swift when EXPO_CUSTOM_BUILD_ROOT is unset', async () => {
    assert.equal(
      await manifestModuleMapAsync({}),
      path.join(packageDir, '.generated', 'module.modulemap')
    );
  });

  it('treats an empty EXPO_CUSTOM_BUILD_ROOT as unset in Package.swift, as the scripts do', async () => {
    assert.equal(
      await manifestModuleMapAsync({ EXPO_CUSTOM_BUILD_ROOT: '' }),
      path.join(packageDir, '.generated', 'module.modulemap')
    );
  });

  // build-xcframework.sh runs xcodebuild under `env -i`, so Package.swift sees only what the
  // script forwards. A stand-in xcodebuild records that environment, then stops the build.
  it('forwards EXPO_CUSTOM_BUILD_ROOT to the xcodebuild that evaluates Package.swift', async () => {
    const scriptsDir = path.join(packageDir, 'scripts');
    await fs.copy(path.join(JSI_APPLE_DIR, 'scripts'), scriptsDir);
    for (const source of [
      'Sources/ExpoModulesJSI/A.swift',
      'Sources/ExpoModulesJSI-Cxx/A.cpp',
      'APINotes/jsi.apinotes',
    ]) {
      await fs.outputFile(path.join(packageDir, source), '');
    }
    const fakeBin = path.join(tmpDir, 'bin');
    const recordedEnv = path.join(tmpDir, 'xcodebuild.env');
    await fs.outputFile(
      path.join(fakeBin, 'xcodebuild'),
      `#!/bin/bash\nenv > "${recordedEnv}"\nexit 1\n`,
      { mode: 0o755 }
    );

    await assert.rejects(
      spawnAsync(path.join(scriptsDir, 'build-xcframework.sh'), [], {
        env: {
          PATH: `${fakeBin}:${process.env.PATH}`,
          HOME: process.env.HOME,
          PODS_ROOT: podsRoot,
          REACT_NATIVE_PATH: tmpDir,
          PLATFORM_NAME: 'iphonesimulator',
          EXPO_CUSTOM_BUILD_ROOT: buildRoot,
        },
      })
    );

    const env = await fs.readFile(recordedEnv, 'utf8');
    assert.match(env, new RegExp(`^EXPO_CUSTOM_BUILD_ROOT=${buildRoot}$`, 'm'));
    assert.equal(fs.existsSync(path.join(packageDir, '.generated')), false);
  });
});
