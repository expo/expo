import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  createAndroidPublicationManifest,
  removeNondeterministicMavenMetadataAsync,
  validateAndroidPublicationRepositoryAsync,
} from './AndroidPrebuilds';

describe('AndroidPrebuilds', () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'android-prebuilds-test-'));
  });

  afterEach(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));

  it('creates a deterministic manifest and validates Maven artifacts', async () => {
    const publication = {
      projectName: 'expo-keep-awake',
      groupId: 'host.exp.exponent',
      artifactId: 'expo.modules.keepawake',
      version: '58.0.0',
      repository: 'local-maven-repo',
    };
    const manifest = createAndroidPublicationManifest('expo-keep-awake', '58.0.0', [
      { projectName: publication.projectName, publication },
    ]);
    assert.deepEqual(manifest.publications, [publication]);

    const coordinate = path.join(
      temporaryDirectory,
      'repository/host/exp/exponent/expo.modules.keepawake/58.0.0'
    );
    fs.mkdirSync(coordinate, { recursive: true });
    for (const extension of ['aar', 'pom', 'module']) {
      fs.writeFileSync(path.join(coordinate, `expo.modules.keepawake-58.0.0.${extension}`), '');
    }
    await validateAndroidPublicationRepositoryAsync(
      path.join(temporaryDirectory, 'repository'),
      manifest
    );
  });

  it('rejects version mismatches, duplicate coordinates, and missing artifacts', async () => {
    const publication = {
      projectName: 'one',
      groupId: 'expo.modules',
      artifactId: 'one',
      version: '1.0.0',
      repository: 'local-maven-repo',
    };
    assert.throws(
      () =>
        createAndroidPublicationManifest('example', '2.0.0', [
          { projectName: publication.projectName, publication },
        ]),
      /expected 2\.0\.0/
    );

    assert.throws(
      () =>
        createAndroidPublicationManifest('example', '1.0.0', [
          { projectName: 'one', publication },
          { projectName: 'two', publication },
        ]),
      /Duplicate Android publication coordinate/
    );
    const manifest = createAndroidPublicationManifest('example', '1.0.0', [
      { projectName: publication.projectName, publication },
    ]);
    await assert.rejects(
      validateAndroidPublicationRepositoryAsync(
        path.join(temporaryDirectory, 'repository'),
        manifest
      ),
      /Missing Android publication artifact/
    );
  });

  it('removes timestamped Maven repository metadata and its checksums', async () => {
    const repository = path.join(temporaryDirectory, 'repository');
    const artifactDirectory = path.join(repository, 'expo/modules/example/1.0.0');
    fs.mkdirSync(artifactDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(repository, 'expo/modules/example/maven-metadata.xml'),
      'timestamped'
    );
    fs.writeFileSync(
      path.join(repository, 'expo/modules/example/maven-metadata.xml.sha256'),
      'digest'
    );
    fs.writeFileSync(path.join(artifactDirectory, 'example-1.0.0.module'), 'artifact');

    await removeNondeterministicMavenMetadataAsync(repository);

    assert.equal(
      fs.existsSync(path.join(repository, 'expo/modules/example/maven-metadata.xml')),
      false
    );
    assert.equal(
      fs.existsSync(path.join(repository, 'expo/modules/example/maven-metadata.xml.sha256')),
      false
    );
    assert.equal(fs.existsSync(path.join(artifactDirectory, 'example-1.0.0.module')), true);
  });
});
