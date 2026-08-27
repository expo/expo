import fs from 'fs';
import os from 'os';
import path from 'path';

import { createManifestForBuildAsync } from '../createManifestForBuildAsync';
import { createUpdatesResourcesAsync, loadEnvForBuild } from '../createUpdatesResources';

jest.mock('../createFingerprintForBuildAsync');
jest.mock('../createManifestForBuildAsync');

const devGlobal = globalThis as typeof globalThis & { __DEV__?: boolean };

describe(loadEnvForBuild, () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalDev: boolean | undefined;
  let projectRoot: string;

  beforeEach(() => {
    originalEnv = process.env;
    originalDev = devGlobal.__DEV__;
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-updates-env-'));
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
  });

  afterEach(() => {
    process.env = originalEnv;
    devGlobal.__DEV__ = originalDev;
    fs.rmSync(projectRoot, { force: true, recursive: true });
  });

  it.each([
    ['development', 'development value', true],
    ['production', 'production value', false],
  ] as const)('loads the %s env files', (mode, expectedValue, expectedDev) => {
    fs.writeFileSync(path.join(projectRoot, `.env.${mode}`), `MODE_VALUE=${expectedValue}`);
    process.env = {
      PATH: originalEnv.PATH,
      __EXPO_CONFIG_MODE: mode,
    };

    expect(loadEnvForBuild(projectRoot)).toBe(mode);
    expect(process.env).toMatchObject({
      MODE_VALUE: expectedValue,
      NODE_ENV: mode,
    });
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
    expect(devGlobal.__DEV__).toBe(expectedDev);
  });

  it('replaces dotenv values inherited from the parent process', () => {
    fs.writeFileSync(path.join(projectRoot, '.env.development'), 'DOTENV_VALUE=local value');
    process.env = {
      EAS_VALUE: 'keep this value',
      PATH: originalEnv.PATH,
      DOTENV_VALUE: 'parent value',
      __EXPO_CONFIG_MODE: 'development',
      __EXPO_ENV_LOADED: JSON.stringify(['DOTENV_VALUE']),
    };

    loadEnvForBuild(projectRoot);

    expect(process.env.DOTENV_VALUE).toBe('local value');
    expect(process.env.EAS_VALUE).toBe('keep this value');
  });

  it.each([
    ['outside EAS Build', undefined, 'development'],
    ['in EAS Build', 'true', 'production'],
  ] as const)('uses the %s fallback', (_, easBuild, mode) => {
    process.env = {
      EAS_BUILD: easBuild,
      PATH: originalEnv.PATH,
    };

    expect(loadEnvForBuild(projectRoot)).toBe(mode);
    expect(process.env.NODE_ENV).toBe(mode);
  });
});

describe(createUpdatesResourcesAsync, () => {
  let originalEnv: NodeJS.ProcessEnv;
  let projectRoot: string;
  let destinationDir: string;

  beforeEach(() => {
    originalEnv = process.env;
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-updates-resources-'));
    destinationDir = path.join(projectRoot, 'destination');
    fs.mkdirSync(destinationDir);
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
    process.env = {
      PATH: originalEnv.PATH,
      __EXPO_CONFIG_MODE: 'production',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(projectRoot, { force: true, recursive: true });
    jest.clearAllMocks();
  });

  it('passes the native build mode to the manifest', async () => {
    await createUpdatesResourcesAsync(['ios', projectRoot, destinationDir, 'all', 'index.js']);

    expect(createManifestForBuildAsync).toHaveBeenCalledWith(
      'ios',
      projectRoot,
      destinationDir,
      'production',
      'index.js'
    );
  });
});
