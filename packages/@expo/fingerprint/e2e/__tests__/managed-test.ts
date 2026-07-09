import spawnAsync from '@expo/spawn-async';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import type { FingerprintSource } from '../../src/Fingerprint.types';
import { getFingerprintHashFromCLIAsync } from './utils/CLIUtils';
import {
  createFingerprintAsync,
  createProjectHashAsync,
  diffFingerprintChangesAsync,
} from '../../src/Fingerprint';
import { normalizeOptionsAsync } from '../../src/Options';
import { getHashSourcesAsync } from '../../src/sourcer/Sourcer';
import { E2E_TEMPLATE_SDK_VERSION } from './utils/constants';

type HashSources = Awaited<ReturnType<typeof getHashSourcesAsync>>;
type HashSource = HashSources[number];
type FingerprintDiff = Awaited<ReturnType<typeof diffFingerprintChangesAsync>>;

function normalizeAutolinkingSourceVersionsForSnapshot<T extends HashSource | FingerprintSource>(
  source: T
): T {
  // SDK templates can resolve different patch releases over time.
  // Keep snapshots focused on the autolinking source shape.
  if (source.type !== 'contents' || !source.id.includes('AutolinkingConfig:')) {
    return source;
  }

  const normalizedSource = {
    ...source,
    contents: JSON.stringify(JSON.parse(source.contents.toString()), (key, value) =>
      key === 'version' || key === 'packageVersion' ? '*' : value
    ),
  };

  return ('hash' in normalizedSource ? { ...normalizedSource, hash: '*' } : normalizedSource) as T;
}

function normalizeAutolinkingVersionsForSnapshot(sources: HashSources): HashSources;
function normalizeAutolinkingVersionsForSnapshot(diff: FingerprintDiff): FingerprintDiff;
function normalizeAutolinkingVersionsForSnapshot(sourcesOrDiff: HashSources | FingerprintDiff) {
  return sourcesOrDiff.map((item) => {
    if (!('op' in item)) {
      return normalizeAutolinkingSourceVersionsForSnapshot(item);
    }

    switch (item.op) {
      case 'added':
        return {
          ...item,
          addedSource: normalizeAutolinkingSourceVersionsForSnapshot(item.addedSource),
        };
      case 'removed':
        return {
          ...item,
          removedSource: normalizeAutolinkingSourceVersionsForSnapshot(item.removedSource),
        };
      case 'changed':
        return {
          ...item,
          beforeSource: normalizeAutolinkingSourceVersionsForSnapshot(item.beforeSource),
          afterSource: normalizeAutolinkingSourceVersionsForSnapshot(item.afterSource),
        };
    }
  });
}

jest.mock('../../src/ExpoConfigLoader', () => ({
  // Mock the getExpoConfigLoaderPath to use the built version rather than the typescript version from src
  getExpoConfigLoaderPath: jest.fn(() =>
    jest.requireActual('path').resolve(__dirname, '..', '..', 'build', 'ExpoConfigLoader.js')
  ),
}));

describe('managed project test', () => {
  jest.setTimeout(600000);
  const tmpDir = require('temp-dir');
  const projectName = 'fingerprint-e2e-managed';
  const projectRoot = path.join(tmpDir, projectName);
  let originalConfig: any;

  beforeAll(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });

    await spawnAsync(
      'bunx',
      ['create-expo-app', '-t', `blank@${E2E_TEMPLATE_SDK_VERSION}`, projectName],
      {
        stdio: 'inherit',
        cwd: tmpDir,
        env: {
          ...process.env,
          // Do not inherit the package manager from this repository
          npm_config_user_agent: undefined,
        },
      }
    );

    originalConfig = JSON.parse(await fs.readFile(path.join(projectRoot, 'app.json'), 'utf8'));
  });

  afterEach(async () => {
    await fs.writeFile(path.join(projectRoot, 'app.json'), JSON.stringify(originalConfig, null, 2));
  });

  afterAll(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });
  });

  it('should have same hash after adding js only library', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    await spawnAsync('npx', ['expo', 'install', '@react-navigation/core'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const hash2 = await createProjectHashAsync(projectRoot);
    expect(hash).toBe(hash2);
  });

  it('should have same hash after updating js code', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    const hashCLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash).toEqual(hashCLI);

    const jsPath = path.join(projectRoot, 'App.js');
    const js = await fs.readFile(jsPath, 'utf8');
    await fs.writeFile(jsPath, `${js}\n// adding comments`);

    const hash2 = await createProjectHashAsync(projectRoot);
    const hash2CLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash2).toEqual(hash2CLI);

    expect(hash).toBe(hash2);
  });

  it('should have different hash after adding native library', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    const hashCLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash).toEqual(hashCLI);

    await spawnAsync('npx', ['expo', 'install', 'expo-updates'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const hash2 = await createProjectHashAsync(projectRoot);
    const hash2CLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash2).toEqual(hash2CLI);

    expect(hash).not.toBe(hash2);
  });

  it('should have different hash after updating `jsEngine`', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    const hashCLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash).toEqual(hashCLI);

    const configPath = path.join(projectRoot, 'app.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    config.expo.jsEngine = 'hermes';
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    const hash2 = await createProjectHashAsync(projectRoot);
    const hash2CLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash2).toEqual(hash2CLI);

    expect(hash).not.toBe(hash2);
  });

  it('should have different hash after updating icon file', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    const hashCLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash).toEqual(hashCLI);

    const iconPath = path.join(projectRoot, 'assets', 'icon.png');
    await fs.writeFile(iconPath, '');

    const hash2 = await createProjectHashAsync(projectRoot);
    const hash2CLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash2).toEqual(hash2CLI);

    expect(hash).not.toBe(hash2);
  });

  it('should have different hash after adding js only config-plugin', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    const hashCLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash).toEqual(hashCLI);

    await spawnAsync('npx', ['expo', 'install', 'expo-build-properties'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const hash2 = await createProjectHashAsync(projectRoot);
    const hash2CLI = await getFingerprintHashFromCLIAsync(projectRoot);
    expect(hash2).toEqual(hash2CLI);

    expect(hash).not.toBe(hash2);
  });

  it('diffFingerprintChangesAsync - should return diff after adding native library', async () => {
    const fingerprint = await createFingerprintAsync(projectRoot);
    await spawnAsync('bun', ['install', '--save', '@react-native-community/netinfo@12.0.1'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const diff = await diffFingerprintChangesAsync(fingerprint, projectRoot);
    expect(normalizeAutolinkingVersionsForSnapshot(diff)).toMatchInlineSnapshot(`
      [
        {
          "afterSource": {
            "contents": "{"@react-native-community/netinfo":{"root":"node_modules/@react-native-community/netinfo","name":"@react-native-community/netinfo","platforms":{"android":{"sourceDir":"node_modules/@react-native-community/netinfo/android","packageImportPath":"import com.reactnativecommunity.netinfo.NetInfoPackage;","packageInstance":"new NetInfoPackage()","buildTypes":[],"libraryName":"RNCNetInfoSpec","componentDescriptors":[],"cmakeListsPath":"node_modules/@react-native-community/netinfo/android/build/generated/source/codegen/jni/CMakeLists.txt","cxxModuleCMakeListsModuleName":null,"cxxModuleCMakeListsPath":null,"cxxModuleHeaderName":null,"isPureCxxDependency":false}}},"expo":{"root":"node_modules/expo","name":"expo","platforms":{"android":{"sourceDir":"node_modules/expo/android","packageImportPath":"import expo.modules.ExpoModulesPackage;","packageInstance":"new ExpoModulesPackage()","buildTypes":[],"componentDescriptors":[],"cmakeListsPath":"node_modules/expo/android/build/generated/source/codegen/jni/CMakeLists.txt","cxxModuleCMakeListsModuleName":null,"cxxModuleCMakeListsPath":null,"cxxModuleHeaderName":null,"isPureCxxDependency":false}}}}",
            "hash": "*",
            "id": "rncoreAutolinkingConfig:android",
            "reasons": [
              "rncoreAutolinkingAndroid",
            ],
            "type": "contents",
          },
          "beforeSource": {
            "contents": "{"expo":{"root":"node_modules/expo","name":"expo","platforms":{"android":{"sourceDir":"node_modules/expo/android","packageImportPath":"import expo.modules.ExpoModulesPackage;","packageInstance":"new ExpoModulesPackage()","buildTypes":[],"componentDescriptors":[],"cmakeListsPath":"node_modules/expo/android/build/generated/source/codegen/jni/CMakeLists.txt","cxxModuleCMakeListsModuleName":null,"cxxModuleCMakeListsPath":null,"cxxModuleHeaderName":null,"isPureCxxDependency":false}}}}",
            "hash": "*",
            "id": "rncoreAutolinkingConfig:android",
            "reasons": [
              "rncoreAutolinkingAndroid",
            ],
            "type": "contents",
          },
          "op": "changed",
        },
        {
          "afterSource": {
            "contents": "{"@react-native-community/netinfo":{"root":"node_modules/@react-native-community/netinfo","name":"@react-native-community/netinfo","platforms":{"ios":{"podspecPath":"node_modules/@react-native-community/netinfo/react-native-netinfo.podspec","version":"*","configurations":[],"scriptPhases":[]}}},"expo":{"root":"node_modules/expo","name":"expo","platforms":{"ios":{"podspecPath":"node_modules/expo/Expo.podspec","version":"*","configurations":[],"scriptPhases":[]}}}}",
            "hash": "*",
            "id": "rncoreAutolinkingConfig:ios",
            "reasons": [
              "rncoreAutolinkingIos",
            ],
            "type": "contents",
          },
          "beforeSource": {
            "contents": "{"expo":{"root":"node_modules/expo","name":"expo","platforms":{"ios":{"podspecPath":"node_modules/expo/Expo.podspec","version":"*","configurations":[],"scriptPhases":[]}}}}",
            "hash": "*",
            "id": "rncoreAutolinkingConfig:ios",
            "reasons": [
              "rncoreAutolinkingIos",
            ],
            "type": "contents",
          },
          "op": "changed",
        },
        {
          "addedSource": {
            "filePath": "node_modules/@react-native-community/netinfo/package.json",
            "hash": "82008ba806a67c1485ebda79b9ea3e45e2d06e92",
            "name": "@react-native-community/netinfo",
            "reasons": [
              "rncoreAutolinkingAndroid",
              "rncoreAutolinkingIos",
            ],
            "type": "package",
            "version": "12.0.1",
          },
          "op": "added",
        },
      ]
    `);
  });

  it('should have same hash even if google service file path is different', async () => {
    const configPath = path.join(projectRoot, 'app.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const googleServicesPath = path.join(projectRoot, 'google-services.json');
    config.expo.android.googleServicesFile = googleServicesPath;
    await fs.writeFile(googleServicesPath, '{}');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    const hash = await createProjectHashAsync(projectRoot);

    // Simulate the EAS environment secrets file path
    const tmpDir = require('temp-dir');
    const googleServicesPathNew = path.join(tmpDir, 'eas-environment-secrets', randomUUID());
    try {
      await fs.mkdir(path.dirname(googleServicesPathNew), { recursive: true });
      await fs.cp(googleServicesPath, googleServicesPathNew, { recursive: true });
      await fs.rm(googleServicesPath, { recursive: true, force: true });
      config.expo.android.googleServicesFile = googleServicesPathNew;
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      const hash2 = await createProjectHashAsync(projectRoot);
      expect(hash).toBe(hash2);
    } finally {
      await fs.rm(path.dirname(googleServicesPathNew), { recursive: true, force: true });
    }
  });

  it('should change the fingerprint under the `strict` preset when the app version changes', async () => {
    const configPath = path.join(projectRoot, 'app.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    const hash = await createProjectHashAsync(projectRoot, { preset: 'strict' });

    config.expo.version = '2.0.0';
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    const hash2 = await createProjectHashAsync(projectRoot, { preset: 'strict' });

    // `strict` hashes the whole ExpoConfig, so a version bump changes the fingerprint.
    expect(hash).not.toBe(hash2);
  });

  it('should keep the same fingerprint under the `relaxed` preset when the app version and name change', async () => {
    const configPath = path.join(projectRoot, 'app.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    const hash = await createProjectHashAsync(projectRoot, { preset: 'relaxed' });

    config.expo.version = '2.0.0';
    config.expo.name = 'renamed-app';
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    const hash2 = await createProjectHashAsync(projectRoot, { preset: 'relaxed' });

    // `relaxed` ignores the app version and name, so neither change affects the fingerprint.
    expect(hash).toBe(hash2);
  });
});

describe(`getHashSourcesAsync - managed project`, () => {
  jest.setTimeout(600000);
  const tmpDir = require('temp-dir');
  const projectName = 'fingerprint-e2e-managed';
  const projectRoot = path.join(tmpDir, projectName);

  beforeAll(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });

    await spawnAsync(
      'bunx',
      ['create-expo-app', '-t', `blank@${E2E_TEMPLATE_SDK_VERSION}`, projectName],
      {
        stdio: 'inherit',
        cwd: tmpDir,
        env: {
          ...process.env,
          // Do not inherit the package manager from this repository
          npm_config_user_agent: undefined,
        },
      }
    );
  });

  afterAll(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });
  });

  it('should match snapshot', async () => {
    const sources = await getHashSourcesAsync(
      projectRoot,
      await normalizeOptionsAsync(projectRoot)
    );
    expect(normalizeAutolinkingVersionsForSnapshot(sources)).toMatchSnapshot();
  });
});
