import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

import runCLIAsync from './utils/CLIUtils';

describe('CLI', () => {
  jest.setTimeout(600000);
  const tmpDir = require('temp-dir');
  const projectName = 'update-e2e-cli-project';
  const projectRoot = path.join(tmpDir, projectName);

  beforeAll(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });
    await spawnAsync('yarn', ['create', 'expo-app', '-t', 'bare-minimum', projectName], {
      stdio: 'inherit',
      cwd: tmpDir,
      env: {
        ...process.env,
        // Do not inherit the package manager from this repository
        npm_config_user_agent: undefined,
      },
    });
  });

  afterAll(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });
  });

  test('fingerprint:generate basic case', async () => {
    await expect(
      runCLIAsync(projectRoot, 'fingerprint:generate', ['--platform', 'ios'])
    ).resolves.not.toThrow();
  });

  test('runtimeversion:resolve basic case', async () => {
    await expect(
      runCLIAsync(projectRoot, 'runtimeversion:resolve', ['--platform', 'ios'])
    ).resolves.not.toThrow();
  });

  test('codesigning:generate basic case', async () => {
    await expect(
      runCLIAsync(projectRoot, 'codesigning:generate', [
        '--key-output-directory',
        'keys',
        '--certificate-output-directory',
        'certs',
        '--certificate-validity-duration-years',
        '10',
        '--certificate-common-name',
        'testname',
      ])
    ).resolves.not.toThrow();
  });

  test('codesigning:configure basic case', async () => {
    await expect(
      runCLIAsync(projectRoot, 'codesigning:configure', [
        '--key-input-directory',
        'keys',
        '--certificate-input-directory',
        'certs',
      ])
    ).resolves.not.toThrow();
  });

  test('configuration:syncnative basic case', async () => {
    await expect(
      runCLIAsync(projectRoot, 'configuration:syncnative', [
        '--platform',
        'ios',
        '--workflow',
        'generic',
      ])
    ).resolves.not.toThrow();
  });
});
