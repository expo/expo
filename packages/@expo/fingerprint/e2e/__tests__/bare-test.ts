import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';

import { createProjectHashAsync } from '../../src/Fingerprint';

describe('bare project test', () => {
  jest.setTimeout(600000);
  const tmpDir = os.tmpdir();
  const projectName = 'fingerprint-e2e-bare';
  const projectRoot = path.join(tmpDir, projectName);

  beforeAll(async () => {
    rimraf.sync(projectRoot);
    await spawnAsync('npx', ['create-expo-app', '-t', 'bare-minimum', projectName], {
      stdio: 'inherit',
      cwd: tmpDir,
    });
  });

  afterAll(async () => {
    rimraf.sync(projectRoot);
  });

  it('should have same hash after adding js only library', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    await spawnAsync('npm', ['install', '--save', '@react-navigation/core'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const hash2 = await createProjectHashAsync(projectRoot);
    expect(hash).toBe(hash2);
  });

  it('should have different hash after adding native library', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    await spawnAsync('npm', ['install', '--save', 'react-native-reanimated'], {
      stdio: 'ignore',
      cwd: projectRoot,
    });
    const hash2 = await createProjectHashAsync(projectRoot);
    expect(hash).not.toBe(hash2);
  });

  it('should have different hash after changing podfile', async () => {
    const hash = await createProjectHashAsync(projectRoot);
    const filePath = path.join(projectRoot, 'ios', 'Podfile');
    let contents = await fs.readFile(filePath, 'utf8');
    contents = contents.replace(/(:fabric_enabled)\s*=>.*,$/gm, '$1 => true,');
    await fs.writeFile(filePath, contents);
    const hash2 = await createProjectHashAsync(projectRoot);
    expect(hash).not.toBe(hash2);
  });

  it('should have same hash for specifing android platform after changing podfile', async () => {
    const hash = await createProjectHashAsync(projectRoot, { platforms: ['android'] });
    const filePath = path.join(projectRoot, 'ios', 'Podfile');
    let contents = await fs.readFile(filePath, 'utf8');
    contents = contents.replace(/(:fabric_enabled)\s*=>.*$/gm, '$1 => false,');
    await fs.writeFile(filePath, contents);
    const hash2 = await createProjectHashAsync(projectRoot, { platforms: ['android'] });
    expect(hash).toBe(hash2);
  });
});
