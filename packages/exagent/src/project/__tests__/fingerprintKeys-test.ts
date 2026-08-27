import { vol } from 'memfs';

import {
  APP_CONFIG_FILE_NAMES,
  HOISTED_SENTINEL_FILE_NAMES,
  MAX_NATIVE_MANIFEST_FILES,
  PROJECT_SENTINEL_FILE_NAMES,
  buildFingerprintKeyManifestAsync,
  manifestsMatch,
} from '../fingerprintKeys';

const projectRoot = '/workspace/app';

beforeEach(() => {
  vol.reset();
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
  it('hashes only the sentinels that exist', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/package-lock.json`]: '{"lockfileVersion":3}',
      [`${projectRoot}/src/App.tsx`]: 'export default null;',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(Object.keys(manifest.files).sort()).toEqual(['package-lock.json', 'package.json']);
    expect(manifest.files['package.json']).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(manifest.cacheable).toBe(true);
  });

  it('moves a hash when a sentinel changes and leaves the others alone', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/yarn.lock`]: 'one',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    vol.writeFileSync(`${projectRoot}/yarn.lock`, 'two');
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(after.files['yarn.lock']).not.toBe(before.files['yarn.lock']);
    expect(after.files['package.json']).toBe(before.files['package.json']);
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

    expect(manifest.files['../pnpm-lock.yaml']).toMatch(/^sha256:/);
    expect(manifest.files['../pnpm-workspace.yaml']).toMatch(/^sha256:/);
    expect(manifest.files['../package.json']).toMatch(/^sha256:/);
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

  it('records the patch files patch-package applies', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/patches/react-native+0.81.0.patch`]: 'diff',
    });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.files['patches/react-native+0.81.0.patch']).toMatch(/^sha256:/);
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

describe('the native directory manifest', () => {
  it('is null for a project with no native directories', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}' });

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.nativeDirs).toEqual({ ios: null, android: null });
  });

  it('moves when a nested native file changes', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/ios/App/AppDelegate.swift`]: 'one',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    // A new size, so the digest moves whatever the in-memory filesystem does with mtimes.
    vol.writeFileSync(`${projectRoot}/ios/App/AppDelegate.swift`, 'one plus more');
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(before.nativeDirs.ios).toMatch(/^sha256:/);
    expect(after.nativeDirs.ios).not.toBe(before.nativeDirs.ios);
    expect(manifestsMatch(before, after)).toBe(false);
  });

  it('moves when a native directory appears, which is what prebuild does', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}' });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    vol.fromJSON({ [`${projectRoot}/android/build.gradle`]: 'gradle' });
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(false);
  });

  it('ignores the generated trees @expo/fingerprint ignores', async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{"name":"app"}',
      [`${projectRoot}/ios/App/AppDelegate.swift`]: 'one',
      [`${projectRoot}/ios/Pods/Manifest.lock`]: 'pods',
      [`${projectRoot}/ios/build/output.o`]: 'object',
      [`${projectRoot}/android/.gradle/cache.bin`]: 'gradle',
      [`${projectRoot}/android/app/build/output.dex`]: 'dex',
    });
    const before = await buildFingerprintKeyManifestAsync(projectRoot);

    vol.writeFileSync(`${projectRoot}/ios/Pods/Manifest.lock`, 'pods changed');
    vol.writeFileSync(`${projectRoot}/android/.gradle/cache.bin`, 'gradle changed');
    const after = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifestsMatch(before, after)).toBe(true);
  });

  it('refuses to be a cache key when the walk is bigger than its budget', async () => {
    const files: Record<string, string> = {
      [`${projectRoot}/package.json`]: '{"name":"app"}',
    };
    for (let index = 0; index <= MAX_NATIVE_MANIFEST_FILES; index++) {
      files[`${projectRoot}/ios/file-${index}.txt`] = String(index);
    }
    vol.fromJSON(files);

    const manifest = await buildFingerprintKeyManifestAsync(projectRoot);

    expect(manifest.cacheable).toBe(false);
    expect(manifest.uncovered.join('\n')).toMatch(/ios/);
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
