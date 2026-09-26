import fs from 'fs';
import os from 'os';
import path from 'path';

import { createFingerprintForBuildAsync } from '../createFingerprintForBuildAsync';
import { createManifestForBuildAsync } from '../createManifestForBuildAsync';
import { createUpdatesResourcesAsync } from '../createUpdatesResources';

jest.mock('../createFingerprintForBuildAsync');
jest.mock('../createManifestForBuildAsync');

describe(createUpdatesResourcesAsync, () => {
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
    jest.resetAllMocks();
  });

  it('loads the mode argument env files over NODE_ENV and parent dotenv values', async () => {
    fs.writeFileSync(path.join(projectRoot, '.env.production'), 'MODE_VALUE=production');
    process.env = {
      PATH: originalEnv.PATH,
      NODE_ENV: 'development',
      MODE_VALUE: 'parent value',
      __EXPO_ENV_LOADED: JSON.stringify(['MODE_VALUE']),
    };
    const assertBuildMode = async () => {
      expect(process.env.NODE_ENV).toBe('production');
      expect(process.env.MODE_VALUE).toBe('production');
    };
    jest.mocked(createManifestForBuildAsync).mockImplementation(assertBuildMode);
    jest.mocked(createFingerprintForBuildAsync).mockImplementation(assertBuildMode);

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

    await createUpdatesResourcesAsync();

    expect(createManifestForBuildAsync).toHaveBeenCalled();
    expect(createFingerprintForBuildAsync).toHaveBeenCalled();
  });
});
