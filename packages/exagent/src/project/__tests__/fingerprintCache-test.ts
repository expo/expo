import { vol } from 'memfs';

import {
  FINGERPRINT_CACHE_FILE_NAME,
  FINGERPRINT_CACHE_TTL_MS,
  readFingerprintCacheAsync,
  resolveFingerprintCliVersion,
  writeFingerprintCacheAsync,
} from '../fingerprintCache';
import { buildFingerprintKeyManifestAsync } from '../fingerprintKeys';

const projectRoot = '/project';
const cachePath = `${projectRoot}/.expo/${FINGERPRINT_CACHE_FILE_NAME}`;

/** A project whose sentinels are all present, so a manifest has something to pin. */
function writeProject(extra: Record<string, string> = {}) {
  vol.fromJSON({
    [`${projectRoot}/package.json`]: '{"name":"app"}',
    [`${projectRoot}/package-lock.json`]: '{"lockfileVersion":3}',
    [`${projectRoot}/app.json`]: '{"expo":{"name":"app"}}',
    [`${projectRoot}/eas.json`]: '{}',
    [`${projectRoot}/node_modules/@expo/fingerprint/package.json`]: '{"version":"0.20.10"}',
    ...extra,
  });
}

/** Store one answer under the key the reads below use. */
async function seedAsync(
  options: {
    platform?: 'ios' | 'android';
    preset?: string;
    cliVersion?: string;
  } = {}
) {
  const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
  await writeFingerprintCacheAsync(projectRoot, {
    platform: options.platform,
    preset: options.preset,
    cliVersion: options.cliVersion ?? '0.20.10',
    hash: 'cached-hash',
    sources: [{ type: 'file', filePath: 'app.json' }],
    manifest,
  });
  return manifest;
}

beforeEach(() => {
  vol.reset();
  writeProject();
});

describe(resolveFingerprintCliVersion, () => {
  it("reads the version out of the project's own @expo/fingerprint", () => {
    expect(resolveFingerprintCliVersion(projectRoot)).toBe('0.20.10');
  });

  it('is null when the package is not installed', () => {
    vol.unlinkSync(`${projectRoot}/node_modules/@expo/fingerprint/package.json`);
    expect(resolveFingerprintCliVersion(projectRoot)).toBeNull();
  });
});

describe(writeFingerprintCacheAsync, () => {
  it('writes the record under .expo, next to the other records', async () => {
    await seedAsync();
    expect(vol.existsSync(cachePath)).toBe(true);
  });

  it('records which files the manifest covered', async () => {
    await seedAsync();
    const record = JSON.parse(vol.readFileSync(cachePath, 'utf8') as string);
    const entry = record.entries['all|default'];
    expect(Object.keys(entry.keyManifest.files)).toEqual(
      expect.arrayContaining(['package.json', 'package-lock.json', 'app.json', 'eas.json'])
    );
    expect(entry.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('keeps the entry of another key', async () => {
    await seedAsync();
    await seedAsync({ platform: 'ios' });
    const record = JSON.parse(vol.readFileSync(cachePath, 'utf8') as string);
    expect(Object.keys(record.entries).sort()).toEqual(['all|default', 'ios|default']);
  });

  // One `status --explain` computes three fingerprints and two of them finish together. Three
  // concurrent read-modify-writes of one file lost an entry, and sometimes truncated the file so
  // that all three were lost [observed — e2e, 2026-08-27].
  it('keeps every entry when three writes finish at once', async () => {
    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    const write = (platform?: 'ios' | 'android') =>
      writeFingerprintCacheAsync(projectRoot, {
        platform,
        cliVersion: '0.20.10',
        hash: `hash-${platform ?? 'all'}`,
        sources: null,
        manifest,
      });

    await Promise.all([write(), write('ios'), write('android')]);

    const record = JSON.parse(vol.readFileSync(cachePath, 'utf8') as string);
    expect(Object.keys(record.entries).sort()).toEqual([
      'all|default',
      'android|default',
      'ios|default',
    ]);
  });

  it('leaves no temporary file behind', async () => {
    await seedAsync();
    expect(
      vol.readdirSync(`${projectRoot}/.expo`).filter((name) => String(name).endsWith('.tmp'))
    ).toEqual([]);
  });

  it('writes nothing when the manifest refuses to be a key', async () => {
    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await writeFingerprintCacheAsync(projectRoot, {
      cliVersion: '0.20.10',
      hash: 'cached-hash',
      sources: null,
      manifest: { ...manifest, cacheable: false },
    });
    expect(vol.existsSync(cachePath)).toBe(false);
  });

  it('writes nothing without a hash to cache', async () => {
    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await writeFingerprintCacheAsync(projectRoot, {
      cliVersion: '0.20.10',
      hash: null,
      sources: null,
      manifest,
    });
    expect(vol.existsSync(cachePath)).toBe(false);
  });

  it('writes nothing when the CLI version could not be read', async () => {
    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await writeFingerprintCacheAsync(projectRoot, {
      cliVersion: null,
      hash: 'cached-hash',
      sources: null,
      manifest,
    });
    expect(vol.existsSync(cachePath)).toBe(false);
  });
});

describe(readFingerprintCacheAsync, () => {
  it('hits when every pinned file is unchanged', async () => {
    const manifest = await seedAsync();

    const hit = await readFingerprintCacheAsync(projectRoot, {
      cliVersion: '0.20.10',
      manifest,
    });

    expect(hit).toMatchObject({
      hash: 'cached-hash',
      revalidatedAgainst: Object.keys(manifest.files).length,
    });
    expect(hit?.sources).toEqual([{ type: 'file', filePath: 'app.json' }]);
    expect(hit?.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('misses after a lockfile is touched', async () => {
    await seedAsync();
    vol.writeFileSync(`${projectRoot}/package-lock.json`, '{"lockfileVersion":4}');

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('misses after app.json is touched', async () => {
    await seedAsync();
    vol.writeFileSync(`${projectRoot}/app.json`, '{"expo":{"name":"renamed"}}');

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('hits after a file no sentinel names is touched', async () => {
    vol.writeFileSync(`${projectRoot}/index.js`, 'one');
    await seedAsync();
    vol.writeFileSync(`${projectRoot}/index.js`, 'two');

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toMatchObject({ hash: 'cached-hash' });
  });

  it('misses after a new sentinel appears', async () => {
    await seedAsync();
    vol.writeFileSync(`${projectRoot}/.fingerprintignore`, 'assets/**');

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('misses after a sentinel is removed', async () => {
    await seedAsync();
    vol.unlinkSync(`${projectRoot}/eas.json`);

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('misses when the fingerprint CLI was upgraded', async () => {
    const manifest = await seedAsync();

    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.21.0',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('misses on a key it has no entry for', async () => {
    const manifest = await seedAsync();

    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
        platform: 'ios',
      })
    ).resolves.toBeNull();
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
        preset: 'strict',
      })
    ).resolves.toBeNull();
  });

  it('keeps the platform and preset entries apart', async () => {
    const manifest = await seedAsync({ platform: 'ios', preset: 'strict' });

    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
        platform: 'ios',
        preset: 'strict',
      })
    ).resolves.toMatchObject({ hash: 'cached-hash' });
  });

  it('misses once the entry is older than the ceiling', async () => {
    const manifest = await seedAsync();
    const record = JSON.parse(vol.readFileSync(cachePath, 'utf8') as string);
    record.entries['all|default'].computedAt = new Date(
      Date.now() - FINGERPRINT_CACHE_TTL_MS - 1000
    ).toISOString();
    vol.writeFileSync(cachePath, JSON.stringify(record));

    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('misses on a record written by another schema version', async () => {
    const manifest = await seedAsync();
    const record = JSON.parse(vol.readFileSync(cachePath, 'utf8') as string);
    record.version = record.version + 1;
    vol.writeFileSync(cachePath, JSON.stringify(record));

    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('misses on a corrupt record instead of throwing', async () => {
    const manifest = await seedAsync();
    vol.writeFileSync(cachePath, '{ this is not json');

    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('misses when there is no record at all', async () => {
    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('misses when the CLI version could not be read', async () => {
    const manifest = await seedAsync();

    await expect(
      readFingerprintCacheAsync(projectRoot, { cliVersion: null, manifest })
    ).resolves.toBeNull();
  });

  it('misses after a native directory appears, which is what prebuild does', async () => {
    await seedAsync();
    vol.fromJSON({ [`${projectRoot}/ios/App/AppDelegate.swift`]: 'delegate' });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });

  it('hits for a bare project whose native files are unchanged', async () => {
    vol.fromJSON({ [`${projectRoot}/ios/App/AppDelegate.swift`]: 'delegate' });
    const manifest = await seedAsync();

    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toMatchObject({ hash: 'cached-hash' });
  });

  it('misses for a bare project after a nested native edit', async () => {
    vol.fromJSON({ [`${projectRoot}/ios/App/AppDelegate.swift`]: 'delegate' });
    await seedAsync();
    vol.writeFileSync(`${projectRoot}/ios/App/AppDelegate.swift`, 'delegate, edited');

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toBeNull();
  });
});
