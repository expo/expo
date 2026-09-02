import fs from 'fs';
import os from 'os';
import path from 'path';

import { createAutolinkingHashSourceAsync } from '../Utils';

describe('createAutolinkingHashSourceAsync', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-fingerprint-autolinking-'));
    const pkgDir = path.join(projectRoot, 'node_modules', 'expo-camera');
    fs.mkdirSync(path.join(pkgDir, 'android'), { recursive: true });
    fs.writeFileSync(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ name: 'expo-camera', version: '1.0.0' })
    );
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('should emit a package source for the `package` source type when the package.json exists', async () => {
    const source = await createAutolinkingHashSourceAsync(
      projectRoot,
      'node_modules/expo-camera/android',
      ['expoAutolinkingAndroid'],
      'package'
    );
    expect(source).toEqual({
      type: 'package',
      name: 'expo-camera',
      version: '1.0.0',
      filePath: 'node_modules/expo-camera/package.json',
      reasons: ['expoAutolinkingAndroid'],
    });
  });

  it('should emit a dir source for the `files` source type', async () => {
    const source = await createAutolinkingHashSourceAsync(
      projectRoot,
      'node_modules/expo-camera/android',
      ['expoAutolinkingAndroid'],
      'files'
    );
    expect(source).toEqual({
      type: 'dir',
      filePath: 'node_modules/expo-camera/android',
      reasons: ['expoAutolinkingAndroid'],
    });
  });

  it('should fall back to a dir source for a local module outside node_modules', async () => {
    fs.mkdirSync(path.join(projectRoot, 'modules', 'local', 'android'), { recursive: true });
    const source = await createAutolinkingHashSourceAsync(
      projectRoot,
      'modules/local/android',
      ['expoAutolinkingAndroid'],
      'package'
    );
    expect(source).toEqual({
      type: 'dir',
      filePath: 'modules/local/android',
      reasons: ['expoAutolinkingAndroid'],
    });
  });

  it('should fall back to a dir source when the package.json is missing', async () => {
    const source = await createAutolinkingHashSourceAsync(
      projectRoot,
      'node_modules/not-installed/android',
      ['expoAutolinkingAndroid'],
      'package'
    );
    expect(source).toEqual({
      type: 'dir',
      filePath: 'node_modules/not-installed/android',
      reasons: ['expoAutolinkingAndroid'],
    });
  });
});
