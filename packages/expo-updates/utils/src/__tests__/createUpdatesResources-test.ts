import fs from 'fs';
import os from 'os';
import path from 'path';

import { createFingerprintForBuildAsync } from '../createFingerprintForBuildAsync';
import { createManifestForBuildAsync } from '../createManifestForBuildAsync';

jest.mock('../createFingerprintForBuildAsync');
jest.mock('../createManifestForBuildAsync');

describe('createUpdatesResources', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];
  let projectRoot: string;
  let destinationDir: string;

  beforeEach(() => {
    originalEnv = process.env;
    originalArgv = process.argv;
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-updates-resources-'));
    destinationDir = path.join(projectRoot, 'destination');
    fs.mkdirSync(destinationDir);
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
    fs.rmSync(projectRoot, { force: true, recursive: true });
  });

  it('loads the mode argument env files over NODE_ENV and parent dotenv values', async () => {
    fs.writeFileSync(path.join(projectRoot, '.env.production'), 'MODE_VALUE=production');
    process.env = {
      PATH: originalEnv.PATH,
      NODE_ENV: 'development',
      MODE_VALUE: 'parent value',
      __EXPO_ENV_LOADED: JSON.stringify(['MODE_VALUE']),
    };
    const readBuildEnv = () => ({
      NODE_ENV: process.env.NODE_ENV,
      MODE_VALUE: process.env.MODE_VALUE,
    });
    const manifestEnv = new Promise((resolve) => {
      jest.mocked(createManifestForBuildAsync).mockImplementation(async () => {
        resolve(readBuildEnv());
      });
    });
    const fingerprintEnv = new Promise((resolve) => {
      jest.mocked(createFingerprintForBuildAsync).mockImplementation(async () => {
        resolve(readBuildEnv());
      });
    });

    process.argv = [
      'node',
      'createUpdatesResources.js',
      'ios',
      projectRoot,
      destinationDir,
      'all',
      'index.js',
      'production',
    ];
    require('../createUpdatesResources');

    const productionEnv = { NODE_ENV: 'production', MODE_VALUE: 'production' };
    expect(await Promise.all([manifestEnv, fingerprintEnv])).toEqual([
      productionEnv,
      productionEnv,
    ]);
  });
});
