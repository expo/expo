import fs from 'fs';
import os from 'os';
import path from 'path';

import { createFingerprintForBuildAsync } from '../createFingerprintForBuildAsync';
import { createManifestForBuildAsync } from '../createManifestForBuildAsync';
import { createUpdatesResourcesAsync } from '../createUpdatesResources';

jest.mock('../createFingerprintForBuildAsync');
jest.mock('../createManifestForBuildAsync');

const devGlobal = globalThis as typeof globalThis & { __DEV__?: boolean };

describe(createUpdatesResourcesAsync, () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalDev: boolean | undefined;
  let projectRoot: string;
  let destinationDir: string;

  beforeEach(() => {
    originalEnv = process.env;
    originalDev = devGlobal.__DEV__;
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-updates-resources-'));
    destinationDir = path.join(projectRoot, 'destination');
    fs.mkdirSync(destinationDir);
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
    process.env = { PATH: originalEnv.PATH };
  });

  afterEach(() => {
    process.env = originalEnv;
    devGlobal.__DEV__ = originalDev;
    fs.rmSync(projectRoot, { force: true, recursive: true });
    jest.resetAllMocks();
  });

  it.each([true, false])('uses dev=%s for both app config and Metro', async (dev) => {
    const mode = dev ? 'development' : 'production';
    fs.writeFileSync(path.join(projectRoot, `.env.${mode}`), `MODE_VALUE=${mode}`);
    process.env = {
      PATH: originalEnv.PATH,
      NODE_ENV: dev ? 'production' : 'development',
      __EXPO_CONFIG_MODE: dev ? 'production' : 'development',
      MODE_VALUE: 'parent value',
      __EXPO_ENV_LOADED: JSON.stringify(['MODE_VALUE']),
      EAS_VALUE: 'keep this value',
    };
    const assertBuildMode = async () => {
      expect(process.env.NODE_ENV).toBe(mode);
      expect(process.env.MODE_VALUE).toBe(mode);
      expect(process.env.EAS_VALUE).toBe('keep this value');
      expect(devGlobal.__DEV__).toBe(dev);
    };
    jest.mocked(createManifestForBuildAsync).mockImplementation(assertBuildMode);
    jest.mocked(createFingerprintForBuildAsync).mockImplementation(assertBuildMode);

    await createUpdatesResourcesAsync([
      'ios',
      projectRoot,
      destinationDir,
      'all',
      'index.js',
      String(dev),
    ]);

    expect(createManifestForBuildAsync).toHaveBeenCalledWith(
      'ios',
      projectRoot,
      destinationDir,
      dev,
      'index.js'
    );
    expect(createFingerprintForBuildAsync).toHaveBeenCalledWith('ios', projectRoot, destinationDir);
  });

  it.each([undefined, 'development'])('rejects the invalid dev argument %j', async (dev) => {
    const args = ['ios', projectRoot, destinationDir, 'all', 'index.js'];
    if (dev !== undefined) {
      args.push(dev);
    }

    await expect(createUpdatesResourcesAsync(args)).rejects.toThrow('Unsupported Metro dev value');
    expect(createManifestForBuildAsync).not.toHaveBeenCalled();
    expect(createFingerprintForBuildAsync).not.toHaveBeenCalled();
  });
});
