import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';

import { updateVersionDerivedFilesAsync, VersionedPackage } from './Versioning';

const temporaryDirectories: string[] = [];

function fixture(): { root: string; packages: VersionedPackage[] } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-versioning-'));
  temporaryDirectories.push(root);
  fs.mkdirSync(path.join(root, 'packages/expo'), { recursive: true });
  fs.mkdirSync(path.join(root, 'packages/expo-module-template'), { recursive: true });
  fs.mkdirSync(path.join(root, 'packages/expo-asset/android'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'packages/expo/bundledNativeModules.json'),
    '{"expo-asset":"~1.0.0","unchanged":"~1.0.0"}\n'
  );
  fs.writeFileSync(
    path.join(root, 'packages/expo-module-template/$package.json'),
    '{"devDependencies":{"expo":"^1.0.0","expo-modules-core":"^1.0.0"}}\n'
  );
  fs.writeFileSync(
    path.join(root, 'packages/expo-asset/android/build.gradle'),
    'version = "1.0.0"\nandroid { defaultConfig { versionName \'1.0.0\' } }\n'
  );
  return {
    root,
    packages: [
      {
        name: 'expo-asset',
        path: path.join(root, 'packages/expo-asset'),
        before: '1.0.0',
        after: '1.0.1',
      },
      {
        name: 'expo',
        path: path.join(root, 'packages/expo'),
        before: '1.0.0',
        after: '1.1.0',
      },
    ],
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('updateVersionDerivedFilesAsync', () => {
  it('updates bundled modules, the module template, and Android versions for stable releases', async () => {
    const { root, packages } = fixture();
    await updateVersionDerivedFilesAsync(packages, false, root);
    assert.deepEqual(
      JSON.parse(
        fs.readFileSync(path.join(root, 'packages/expo/bundledNativeModules.json'), 'utf8')
      ),
      { 'expo-asset': '~1.0.1', unchanged: '~1.0.0' }
    );
    assert.match(
      fs.readFileSync(path.join(root, 'packages/expo-module-template/$package.json'), 'utf8'),
      /"expo":"\^1\.1\.0"/
    );
    const gradle = fs.readFileSync(
      path.join(root, 'packages/expo-asset/android/build.gradle'),
      'utf8'
    );
    assert.match(gradle, /version = "1\.0\.1"/);
    assert.match(gradle, /versionName '1\.0\.1'/);
  });

  it('pins derived ranges for canary snapshots', async () => {
    const { root, packages } = fixture();
    packages[0].after = '1.0.1-canary-test';
    packages[1].after = '1.1.0-canary-test';
    await updateVersionDerivedFilesAsync(packages, true, root);
    assert.equal(
      JSON.parse(
        fs.readFileSync(path.join(root, 'packages/expo/bundledNativeModules.json'), 'utf8')
      )['expo-asset'],
      '1.0.1-canary-test'
    );
    assert.match(
      fs.readFileSync(path.join(root, 'packages/expo-module-template/$package.json'), 'utf8'),
      /"expo":"1\.1\.0-canary-test"/
    );
  });
});
