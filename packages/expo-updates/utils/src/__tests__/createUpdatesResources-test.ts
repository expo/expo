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

    loadEnvForBuild(projectRoot);
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
    { location: 'outside EAS Build', easBuild: undefined, mode: 'development' },
    { location: 'inside EAS Build', easBuild: 'true', mode: 'production' },
  ] as const)('uses $mode mode $location', ({ easBuild, mode }) => {
    process.env = {
      EAS_BUILD: easBuild,
      PATH: originalEnv.PATH,
    };

    loadEnvForBuild(projectRoot);
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

  it('keeps the Metro dev mode separate from the config mode', async () => {
    await createUpdatesResourcesAsync([
      'ios',
      projectRoot,
      destinationDir,
      'all',
      'index.js',
      'true',
    ]);

    expect(createManifestForBuildAsync).toHaveBeenCalledWith(
      'ios',
      projectRoot,
      destinationDir,
      true,
      'index.js'
    );
  });
});
