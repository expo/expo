import { vol } from 'memfs';

import {
  APP_CONFIG_FILE_NAMES,
  FINGERPRINT_KEY_KIND,
  HOISTED_SENTINEL_FILE_NAMES,
  PROJECT_SENTINEL_FILE_NAMES,
  buildFingerprintKeyManifestAsync,
  manifestsMatch,
} from '../fingerprintKeys';

const projectRoot = '/workspace/app';

beforeEach(() => {
  vol.reset();
});

describe('the key kind', () => {
  // Named rather than described in prose, because the printed report and `--json` both carry it: a
  // reader is told which check ran, not left to assume the stronger one (llp/0021).
  it('says what one entry actually is', () => {
    expect(FINGERPRINT_KEY_KIND).toBe('mtime+size');
  });
});

describe('the sentinel list', () => {
  it('names every lockfile the package managers write', () => {
    for (const name of [
      'package-lock.json',
      'npm-shrinkwrap.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'bun.lock',
      'bun.lockb',
      'deno.lock',
    ]) {
      expect(PROJECT_SENTINEL_FILE_NAMES).toContain(name);
      expect(HOISTED_SENTINEL_FILE_NAMES).toContain(name);
    }
  });

  it('names every app config spelling @expo/config accepts', () => {
    // Observed — `@expo/config` `src/Config.ts`: the static pair plus `app.config` under
    // DYNAMIC_CONFIG_EXTS.
    expect(APP_CONFIG_FILE_NAMES).toEqual([
      'app.json',
      'app.config.json',
      'app.config.ts',
      'app.config.mts',
      'app.config.cts',
      'app.config.mjs',
      'app.config.cjs',
      'app.config.js',
    ]);
    for (const name of APP_CONFIG_FILE_NAMES) {
      expect(PROJECT_SENTINEL_FILE_NAMES).toContain(name);
    }
  });

  it('names eas.json, package.json and the fingerprint own settings', () => {
    for (const name of [
      'package.json',
      'eas.json',
      '.easignore',
      '.gitignore',
      '.fingerprintignore',
      'fingerprint.config.js',
      'fingerprint.config.cjs',
    ]) {
      expect(PROJECT_SENTINEL_FILE_NAMES).toContain(name);
    }
  });
});

describe(buildFingerprintKeyManifestAsync, () => {
  it('stamps only the sentinels that exist', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/package-lock.json`]: '{"lockfileVersion":3}',
      [`${projectRoot}/src/App.tsx`]: 'export default null;',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(Object.keys(manifest.files).sort()).toEqual(['package-lock.json', 'package.json']);
    // Size and modification time, not a content hash: one `stat` per file, so a 295 KB lockfile
    // costs what an empty `app.json` costs (llp/0023 §The key is a stamp, not a hash).
    expect(manifest.files['package.json']).toMatch(/^\d+ \d+(\.\d+)?$/);
    expect(manifest.cacheable).toBe(true);
  });

  it('moves a stamp when a sentinel changes and leaves the others alone', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/yarn.lock`]: 'one',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    // A new length, so the stamp moves on the size alone — an in-memory filesystem can write twice
    // inside one millisecond, and a test that leaned on the timestamp would pass by luck.
    vol.writeFileSync(`${projectRoot}/yarn.lock`, 'two and then some');
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(after.files['yarn.lock']).not.toBe(before.files['yarn.lock']);
    expect(after.files['package.json']).toBe(before.files['package.json']);
    expect(manifestsMatch(before, after)).toBe(false);
  });

  // @ref llp/0023-fingerprint-caching.rfc.md §What the stamps miss
  // The honest limit of a stamp, pinned so nobody discovers it as a surprise: an edit that keeps
  // both the length and the timestamp is invisible here, and the record's TTL is what catches it.
  it('cannot see an edit that preserved the size and the modification time', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/app.json`]: '{"expo":{"name":"aaa"}}',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);
    const stat = vol.statSync(`${projectRoot}/app.json`);

    vol.writeFileSync(`${projectRoot}/app.json`, '{"expo":{"name":"bbb"}}');
    vol.utimesSync(`${projectRoot}/app.json`, stat.atime, stat.mtime);
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(true);
  });

  it('sees a sentinel that was touched without being changed, and costs a recomputation for it', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/yarn.lock`]: 'unchanged bytes',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    // What a `git checkout` does. Wrong in the safe direction: a slow answer, never a false one.
    const touched = new Date(Date.now() + 60_000);
    vol.utimesSync(`${projectRoot}/yarn.lock`, touched, touched);
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(false);
  });

  it('leaves a file no sentinel names out of the manifest', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/src/App.tsx`]: 'one',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    vol.writeFileSync(`${projectRoot}/src/App.tsx`, 'two');
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(true);
  });

  it('walks up to the workspace root for a hoisted lockfile', async () => {
    vol.fromJSON({
      '/workspace/pnpm-lock.yaml': 'hoisted',
      '/workspace/pnpm-workspace.yaml': 'packages:\n  - app',
      '/workspace/package.json': '{"name":"workspace"}',
      [`${projectRoot}/package.json`]: '{"name":"app"}',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.files['../pnpm-lock.yaml']).toMatch(/^\d+ /);
    expect(manifest.files['../pnpm-workspace.yaml']).toMatch(/^\d+ /);
    expect(manifest.files['../package.json']).toMatch(/^\d+ /);
  });

  it('does not record an ancestor sentinel twice when the project is its own root', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/package-lock.json`]: 'lock',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(Object.keys(manifest.files).filter((key) => key.startsWith('..'))).toEqual([]);
  });

  it('records the files a static config points at', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: {
          icon: './assets/icon.png',
          android: {
            googleServicesFile: './google-services.json',
            adaptiveIcon: { foregroundImage: './assets/adaptive.png' },
          },
          ios: { googleServicesFile: './GoogleService-Info.plist' },
          plugins: [['expo-splash-screen', { image: './assets/splash.png' }]],
        },
      }),
      [`${projectRoot}/assets/icon.png`]: 'icon',
      [`${projectRoot}/assets/adaptive.png`]: 'adaptive',
      [`${projectRoot}/assets/splash.png`]: 'splash',
      [`${projectRoot}/google-services.json`]: '{}',
      [`${projectRoot}/GoogleService-Info.plist`]: '<plist/>',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(Object.keys(manifest.files)).toEqual(
      expect.arrayContaining([
        'assets/icon.png',
        'assets/adaptive.png',
        'assets/splash.png',
        'google-services.json',
        'GoogleService-Info.plist',
      ])
    );
  });

  // @ref llp/0023-fingerprint-caching.rfc.md §What a cached hash is revalidated against
  //
  // F112. Since SDK 57 the default scaffold's `ios.icon` is `./assets/expo.icon`, which is a
  // *directory* — an icon bundle holding `icon.json` and an `Assets/` tree. `stat` of a directory
  // is not a file stamp, so the entry used to vanish out of the manifest silently: no entry, no
  // mismatch, and `uncovered` never named it either. Editing a file inside the bundle moved the
  // real hash while a warm `status` kept answering the old one for the whole TTL [observed —
  // 2026-08-28, wave 27, a bun-installed SDK 57 scaffold: f50891f3 became ed4b0454 under
  // `--no-fingerprint-cache` while the cached answer stayed f50891f3].
  it('records the files inside a directory the config points at', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: { ios: { icon: './assets/expo.icon' } },
      }),
      [`${projectRoot}/assets/expo.icon/icon.json`]: '{"fill":{}}',
      [`${projectRoot}/assets/expo.icon/Assets/Front.png`]: 'front',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(Object.keys(manifest.files)).toEqual(
      expect.arrayContaining(['assets/expo.icon/icon.json', 'assets/expo.icon/Assets/Front.png'])
    );
  });

  // The half that makes the case above a *cache* fix rather than a manifest detail: a file inside
  // the bundle that changed has to make the two manifests disagree, or the record is still believed.
  it('notices a file inside such a directory changing', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: { ios: { icon: './assets/expo.icon' } },
      }),
      [`${projectRoot}/assets/expo.icon/icon.json`]: '{"fill":{}}',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    // A different length, so the stamp moves whatever the clock did (llp/0023 §The key is a stamp, not a hash).
    vol.writeFileSync(`${projectRoot}/assets/expo.icon/icon.json`, '{"fill":{"a":1,"b":2}}');
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(false);
  });

  // The general form of F112, and the reason the icon case is not the whole fix: a path the config
  // *points at* that exists and yields no stamp used to leave the manifest with nothing said. No
  // entry is no mismatch, so whatever is behind it can change freely — and `uncovered` claimed the
  // assets were covered. A directory too deep to walk is the case left after the expansion above;
  // an unreadable one is the other. Either way the manifest now says which path it dropped.
  it('names a path the config points at that it could not stamp', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: { icon: './assets/deep' },
      }),
      // Six levels, past the four the walk goes: the bottom is reached as a directory rather than
      // as a file, so it cannot be stamped.
      [`${projectRoot}/assets/deep/a/b/c/d/e/icon.png`]: 'icon',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.uncovered.join('\n')).toMatch(/assets\/deep/);
  });

  // The other direction, asserted as a limit: a config pointing at a file that is simply *not there*
  // is not a gap. Its absence is already pinned, because a file that later appears grows the set and
  // `manifestsMatch` requires the same set — so naming it would be a caveat about nothing.
  it('does not name a path that is merely absent', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { icon: './assets/missing.png' } }),
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.uncovered.join('\n')).not.toMatch(/missing\.png/);
  });

  it('records the patch files patch-package applies', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/patches/react-native+0.81.0.patch`]: 'diff',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.files['patches/react-native+0.81.0.patch']).toMatch(/^\d+ /);
  });

  it('names the dynamic config as something it cannot pin', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/app.config.js`]: 'module.exports = { name: process.env.APP_NAME };',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.uncovered.join('\n')).toMatch(/app\.config\.js/);
    expect(manifest.cacheable).toBe(true);
  });

  it('always names node_modules as something it cannot pin', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}' });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.uncovered.join('\n')).toMatch(/node_modules/);
  });
});

// @ref llp/0023-fingerprint-caching.rfc.md §The native directories are not pinned
//
// `ios/` and `android/` are deliberately outside the key [decided, 2026-08-27]. That makes a
// native edit invisible to the manifest, which is the reason the record's TTL is short: the expiry
// is the only thing that catches it. These cases pin that as intended behaviour rather than leaving
// it to be found.
describe('the native directories', () => {
  it('are not in the manifest at all', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/ios/App/AppDelegate.swift`]: 'import UIKit',
      [`${projectRoot}/android/build.gradle`]: 'gradle',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(Object.keys(manifest.files).filter((key) => key.startsWith('ios/'))).toEqual([]);
    expect(Object.keys(manifest.files).filter((key) => key.startsWith('android/'))).toEqual([]);
    // Still a usable key for everything else. A bare project is cached like any other.
    expect(manifest.cacheable).toBe(true);
  });

  it('do not move the key when a nested native file changes', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/ios/App/AppDelegate.swift`]: 'one',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    vol.writeFileSync(`${projectRoot}/ios/App/AppDelegate.swift`, 'one plus a real native change');
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(true);
  });

  it('do not move the key when they appear, which is what prebuild does', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}' });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    vol.fromJSON({ [`${projectRoot}/android/build.gradle`]: 'gradle' });
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    // `@expo/agent-cli dev` drops the whole record after a plan step for exactly this reason
    // (`src/dev/devAsync.ts`); a prebuild run some other way rides on the expiry.
    expect(manifestsMatch(before, after)).toBe(true);
  });

  it('are named as uncovered, whether or not the project has them', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}' });

    const uncovered = (await buildFingerprintKeyManifestAsync(projectRoot)).uncovered.join('\n');

    expect(uncovered).toMatch(/ios\/ and android\//);
    expect(uncovered).toMatch(/expiry/);
  });
});

describe(manifestsMatch, () => {
  it('is true for the same manifest read twice', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/app.json`]: '{"expo":{}}',
    });

    const first = await buildFingerprintKeyManifestAsync(projectRoot);
    const second = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(first, second)).toBe(true);
  });

  it('is false when a sentinel is removed', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/eas.json`]: '{}',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    vol.unlinkSync(`${projectRoot}/eas.json`);
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(false);
  });

  it('is false when a sentinel is added', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}' });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    vol.writeFileSync(`${projectRoot}/eas.json`, '{}');
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(false);
  });
});
