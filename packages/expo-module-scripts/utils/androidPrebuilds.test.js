import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { stageAndroidPrebuilds, validateRawAndroidPrebuilds } from './androidPrebuilds.js';

function fixture(version = '1.0.0') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'android-prebuilds-'));
  const publication = {
    projectName: 'expo-fixture',
    groupId: 'expo.modules',
    artifactId: 'fixture',
    version,
    repository: 'local-maven-repo',
  };
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'expo-fixture',
      version,
      scripts: { 'precompile-android': 'precompile fixture' },
    })
  );
  fs.writeFileSync(
    path.join(root, 'expo-module.config.json'),
    `${JSON.stringify(
      {
        platforms: ['android'],
        android: {
          publication: {
            groupId: publication.groupId,
            artifactId: publication.artifactId,
            repository: publication.repository,
          },
        },
      },
      null,
      2
    )}\n`
  );
  const output = path.join(root, '.expo-prebuild-android');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, 'publication.json'),
    JSON.stringify({
      schemaVersion: 1,
      packageName: 'expo-fixture',
      packageVersion: version,
      publications: [publication],
    })
  );
  const coordinate = path.join(output, `local-maven-repo/expo/modules/fixture/${version}`);
  fs.mkdirSync(coordinate, { recursive: true });
  for (const extension of ['aar', 'pom', 'module']) {
    fs.writeFileSync(path.join(coordinate, `fixture-${version}.${extension}`), extension);
  }
  return root;
}

test('stages an embedded Maven repository without modifying committed config', () => {
  const root = fixture();
  const configPath = path.join(root, 'expo-module.config.json');
  const original = fs.readFileSync(configPath, 'utf8');
  assert.equal(validateRawAndroidPrebuilds(root), true);
  assert.equal(stageAndroidPrebuilds(root), true);
  assert.equal(fs.readFileSync(configPath, 'utf8'), original);
  assert.equal(
    fs.readFileSync(
      path.join(root, 'local-maven-repo/expo/modules/fixture/1.0.0/fixture-1.0.0.aar'),
      'utf8'
    ),
    'aar'
  );
  assert.equal(fs.readFileSync(configPath, 'utf8'), original);
});

test('rejects stale versions and missing artifacts before staging', () => {
  const root = fixture();
  const manifestPath = path.join(root, '.expo-prebuild-android/publication.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.packageVersion = '2.0.0';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.throws(() => stageAndroidPrebuilds(root), /does not match expo-fixture@1\.0\.0/);
  manifest.packageVersion = '1.0.0';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  fs.rmSync(
    path.join(
      root,
      '.expo-prebuild-android/local-maven-repo/expo/modules/fixture/1.0.0/fixture-1.0.0.aar'
    )
  );
  assert.throws(() => stageAndroidPrebuilds(root), /artifact is missing/);
});

test('stages canary publication versions while config remains versionless', () => {
  const version = '59.0.0-canary-20260911-deadbee';
  const root = fixture(version);
  assert.equal(stageAndroidPrebuilds(root), true);
  assert.equal(
    fs.existsSync(
      path.join(root, `local-maven-repo/expo/modules/fixture/${version}/fixture-${version}.aar`)
    ),
    true
  );
});

test('packages without the Android precompile marker are lifecycle no-ops', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'android-prebuilds-'));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'fixture', scripts: {} })
  );
  assert.equal(validateRawAndroidPrebuilds(root), false);
  assert.equal(stageAndroidPrebuilds(root), false);
});
