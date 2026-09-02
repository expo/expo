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

// One case per layout a package manager actually writes, because a null answer here turns the whole
// cross-run cache off and the failure is invisible — the report says `computed`, which is true.
// Each was verified live before it was written as a fixture [observed — 2026-08-28, wave 27]:
//
// | manager | where `@expo/fingerprint` is | case below |
// | --- | --- | --- |
// | npm, bun, yarn (flat) | `<project>/node_modules/@expo/fingerprint` | "the project's own" |
// | npm/yarn workspaces (hoisted) | an ancestor's `node_modules` | "walks up to a workspace root" |
// | pnpm (isolated) | beside `expo` in the virtual store, through a symlink | the last two |
describe(resolveFingerprintCliVersion, () => {
  it("reads the version out of the project's own @expo/fingerprint", () => {
    expect(resolveFingerprintCliVersion(projectRoot)).toBe('0.20.10');
  });

  it('is null when the package is not installed', () => {
    vol.unlinkSync(`${projectRoot}/node_modules/@expo/fingerprint/package.json`);
    expect(resolveFingerprintCliVersion(projectRoot)).toBeNull();
  });

  // @ref llp/0023-fingerprint-caching.rfc.md §Layer 2: the cross-run cache
  //
  // F111. A hoisted workspace install puts the package above the app, the way it puts the lockfile
  // there, so a literal `<projectRoot>/node_modules/@expo/fingerprint` finds nothing — and a null
  // version turns the whole cross-run cache off, silently, for every project in that shape.
  it('walks up to a workspace root the install was hoisted to', () => {
    vol.unlinkSync(`${projectRoot}/node_modules/@expo/fingerprint/package.json`);
    vol.fromJSON({
      '/node_modules/@expo/fingerprint/package.json': '{"version":"0.20.10"}',
    });

    expect(resolveFingerprintCliVersion(projectRoot)).toBe('0.20.10');
  });

  // The pnpm shape, which the walk above does not reach: the package is not in any ancestor
  // `node_modules` at all, only beside `expo` in the virtual store. The fingerprint CLI *is* found
  // and spawned there (pnpm writes `node_modules/.bin/fingerprint`), so refusing to cache is an
  // asymmetry rather than a policy [observed — 2026-08-28, wave 27: two consecutive `status` runs
  // in a pnpm workspace both reported `source: "computed"` and wrote no record at all].
  it("finds the copy beside the project's own expo package", () => {
    vol.unlinkSync(`${projectRoot}/node_modules/@expo/fingerprint/package.json`);
    vol.fromJSON({
      [`${projectRoot}/node_modules/expo/package.json`]: '{"name":"expo","version":"57.0.17"}',
      [`${projectRoot}/node_modules/expo/node_modules/@expo/fingerprint/package.json`]:
        '{"version":"0.20.10"}',
    });

    expect(resolveFingerprintCliVersion(projectRoot)).toBe('0.20.10');
  });

  // The shape pnpm actually writes, and the reason the case above is not enough: the project's
  // `node_modules/expo` is a **symlink** into the virtual store, and the sibling the fingerprint
  // package sits beside is the link's *target*. A walk that continued from the link's own path
  // climbed back out through the project and found nothing [observed — 2026-08-28, wave 27: the
  // first fix passed this file's other cases and still wrote no record in a real pnpm workspace].
  it('follows the symlink pnpm writes into its virtual store', () => {
    vol.unlinkSync(`${projectRoot}/node_modules/@expo/fingerprint/package.json`);
    vol.fromJSON({
      '/store/expo@57.0.17/node_modules/expo/package.json': '{"name":"expo","version":"57.0.17"}',
      '/store/expo@57.0.17/node_modules/@expo/fingerprint/package.json': '{"version":"0.20.10"}',
    });
    vol.symlinkSync('/store/expo@57.0.17/node_modules/expo', `${projectRoot}/node_modules/expo`);

    expect(resolveFingerprintCliVersion(projectRoot)).toBe('0.20.10');
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
    // What kind of check, and how old — the two facts a reader needs to weigh a hit, since the
    // stamps do not cover `ios/`/`android/` and the age is what bounds that (llp/0023).
    expect(hit?.keyKind).toBe('mtime+size');
    expect(hit?.ageMs).toBeGreaterThanOrEqual(0);
    expect(hit?.ageMs).toBeLessThan(FINGERPRINT_CACHE_TTL_MS);
  });

  it('misses after a lockfile is touched', async () => {
    await seedAsync();
    // A different length. The stamp is size and modification time, and an in-memory filesystem can
    // write twice inside one millisecond, so a same-length rewrite here would pass or fail by luck —
    // it is its own case in `fingerprintKeys-test.ts`, as a limit rather than as a miss.
    vol.writeFileSync(`${projectRoot}/package-lock.json`, '{"lockfileVersion":4,"packages":{}}');

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
    vol.writeFileSync(`${projectRoot}/app.json`, '{"expo":{"name":"renamed for a longer name"}}');

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

  // @ref llp/0023-fingerprint-caching.rfc.md §The native directories are not pinned
  //
  // The next three are **hits**, and that is the design rather than a gap left open: the key says
  // nothing about `ios/` or `android/`, so the expiry above is the whole of what catches a native
  // change. They are asserted so that the day somebody narrows the TTL or puts the walk back, the
  // tests say which behaviour moved.
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

  it('still hits after a native directory appears, which the expiry has to catch', async () => {
    await seedAsync();
    vol.fromJSON({ [`${projectRoot}/ios/App/AppDelegate.swift`]: 'delegate' });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toMatchObject({ hash: 'cached-hash' });
  });

  it('still hits after a nested native edit, which the expiry has to catch', async () => {
    vol.fromJSON({ [`${projectRoot}/ios/App/AppDelegate.swift`]: 'delegate' });
    await seedAsync();
    vol.writeFileSync(`${projectRoot}/ios/App/AppDelegate.swift`, 'delegate, edited');

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);
    await expect(
      readFingerprintCacheAsync(projectRoot, {
        cliVersion: '0.20.10',
        manifest,
      })
    ).resolves.toMatchObject({ hash: 'cached-hash' });
  });

  it('names what the hit could not cover, native directories included', async () => {
    const manifest = await seedAsync();

    const hit = await readFingerprintCacheAsync(projectRoot, {
      cliVersion: '0.20.10',
      manifest,
    });

    expect(hit!.uncovered.join('\n')).toMatch(/ios\/ and android\//);
    expect(hit!.uncovered.join('\n')).toMatch(/node_modules/);
  });
});
