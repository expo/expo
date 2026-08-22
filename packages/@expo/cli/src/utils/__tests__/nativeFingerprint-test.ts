import type { FingerprintSource } from '@expo/fingerprint';
import { vol } from 'memfs';

import {
  formatPrebuildChanges,
  getNativeDirectoryStaleness,
  getPrebuildFingerprintMarkerPath,
  getPrebuildStaleness,
  importFingerprint,
  readPrebuildFingerprintMarker,
  rebuildCommands,
  recordPrebuildFingerprintAsync,
} from '../nativeFingerprint';

const projectRoot = '/app';

const configSource: FingerprintSource = {
  type: 'contents',
  id: 'expoConfig',
  contents: '{"name":"app"}',
  reasons: ['expoConfig'],
  hash: 'config-hash',
};

const pluginSource: FingerprintSource = {
  type: 'file',
  filePath: 'app.plugin.js',
  reasons: ['expoConfigPlugins'],
  hash: 'plugin-hash',
};

const autolinkingSource: FingerprintSource = {
  type: 'package',
  name: 'expo-camera',
  version: '17.0.0',
  filePath: 'node_modules/expo-camera/package.json',
  reasons: ['expoAutolinkingAndroid'],
  hash: 'camera-hash',
};

afterEach(() => {
  vol.reset();
});

// filterPrebuildSources has no dedicated test: the `fresh` case below only passes when
// non-prebuild sources (autolinking) are filtered out of the comparison.
describe(getPrebuildStaleness, () => {
  const marker = {
    version: 1 as const,
    platform: 'ios' as const,
    hash: 'full-hash',
    sources: [configSource, pluginSource, autolinkingSource],
    fingerprintVersion: '0.19.3',
    createdAt: '2026-08-11T00:00:00.000Z',
  };

  it(`is fresh when prebuild-relevant sources match, even when others differ`, () => {
    const changedAutolinking = {
      ...autolinkingSource,
      hash: 'new-camera-hash',
    };
    expect(
      getPrebuildStaleness({
        marker,
        currentSources: [configSource, pluginSource, changedAutolinking],
        currentFingerprintVersion: '0.19.3',
      })
    ).toEqual({ status: 'fresh', changes: [] });
  });

  it(`is stale when the expo config hash changes`, () => {
    const changedConfig = { ...configSource, hash: 'new-config-hash' };
    expect(
      getPrebuildStaleness({
        marker,
        currentSources: [changedConfig, pluginSource, autolinkingSource],
        currentFingerprintVersion: '0.19.3',
      })
    ).toEqual({ status: 'stale', changes: [{ source: 'app config', change: 'changed' }] });
  });

  it(`is stale when a plugin source is added`, () => {
    const newPlugin: FingerprintSource = {
      type: 'file',
      filePath: 'other.plugin.js',
      reasons: ['expoConfigPlugins'],
      hash: 'other-plugin-hash',
    };
    expect(
      getPrebuildStaleness({
        marker,
        currentSources: [configSource, pluginSource, newPlugin],
        currentFingerprintVersion: '0.19.3',
      })
    ).toEqual({
      status: 'stale',
      changes: [{ source: 'other.plugin.js', change: 'added' }],
    });
  });

  it(`reports every changed source, sorted, when a plugin is removed`, () => {
    const changedConfig = { ...configSource, hash: 'new-config-hash' };
    expect(
      getPrebuildStaleness({
        marker,
        currentSources: [changedConfig, autolinkingSource],
        currentFingerprintVersion: '0.19.3',
      })
    ).toEqual({
      status: 'stale',
      changes: [
        { source: 'app config', change: 'changed' },
        { source: 'app.plugin.js', change: 'removed' },
      ],
    });
  });

  it(`is unknown without a marker`, () => {
    expect(
      getPrebuildStaleness({
        marker: null,
        currentSources: [configSource],
        currentFingerprintVersion: '0.19.3',
      })
    ).toEqual({ status: 'unknown', changes: [] });
  });

  it(`is unknown when the fingerprint version differs`, () => {
    expect(
      getPrebuildStaleness({
        marker,
        currentSources: [configSource, pluginSource, autolinkingSource],
        currentFingerprintVersion: '0.20.0',
      })
    ).toEqual({ status: 'unknown', changes: [] });
  });
});

describe(formatPrebuildChanges, () => {
  const changes = [
    { source: 'app config', change: 'changed' as const },
    { source: 'app.plugin.js', change: 'added' as const },
    { source: 'plugins/withFoo.js', change: 'removed' as const },
    { source: 'plugins/withBar.js', change: 'removed' as const },
  ];

  it(`names every change when the list is short`, () => {
    expect(formatPrebuildChanges(changes.slice(0, 2))).toBe('app config, app.plugin.js');
  });

  it(`truncates long lists`, () => {
    expect(formatPrebuildChanges(changes)).toBe(
      'app config, app.plugin.js, plugins/withFoo.js, and 1 more'
    );
  });

  it(`is empty without changes`, () => {
    expect(formatPrebuildChanges([])).toBe('');
  });
});

describe(recordPrebuildFingerprintAsync, () => {
  it(`writes a marker that reads back`, async () => {
    vol.fromJSON({ [projectRoot + '/package.json']: '{}' });
    const fakeModule = {
      createFingerprintAsync: jest.fn(async () => ({
        hash: 'full-hash',
        sources: [configSource, autolinkingSource],
      })),
    };

    const marker = await recordPrebuildFingerprintAsync(projectRoot, 'ios', {
      Fingerprint: fakeModule as any,
      version: '0.19.3',
    });

    expect(fakeModule.createFingerprintAsync).toHaveBeenCalledWith(projectRoot, {
      platforms: ['ios'],
      silent: true,
    });
    expect(marker).toMatchObject({
      version: 1,
      platform: 'ios',
      hash: 'full-hash',
      fingerprintVersion: '0.19.3',
    });
    const restored = readPrebuildFingerprintMarker(projectRoot, 'ios');
    expect(restored).toEqual(marker);
    expect(restored!.sources).toEqual([configSource, autolinkingSource]);
  });

  it(`resolves null without a fingerprint module`, async () => {
    await expect(recordPrebuildFingerprintAsync(projectRoot, 'ios', null)).resolves.toBeNull();
  });

  it(`never throws when the fingerprint computation fails`, async () => {
    const fakeModule = {
      createFingerprintAsync: jest.fn(async () => {
        throw new Error('boom');
      }),
    };
    await expect(
      recordPrebuildFingerprintAsync(projectRoot, 'ios', {
        Fingerprint: fakeModule as any,
        version: '0.19.3',
      })
    ).resolves.toBeNull();
  });
});

describe(readPrebuildFingerprintMarker, () => {
  it.each([
    ['the marker is missing', null],
    ['the marker is invalid JSON', 'not json'],
    [
      'the marker version is unknown',
      JSON.stringify({
        version: 99,
        platform: 'android',
        hash: 'x',
        sources: [],
        fingerprintVersion: '0.19.3',
        createdAt: '2026-08-11T00:00:00.000Z',
      }),
    ],
  ])(`returns null when %s`, (_description, contents) => {
    if (contents != null) {
      vol.fromJSON({ [getPrebuildFingerprintMarkerPath(projectRoot, 'android')]: contents });
    }
    expect(readPrebuildFingerprintMarker(projectRoot, 'android')).toBeNull();
  });
});

describe(importFingerprint, () => {
  it(`throws when the fingerprint package resolves but fails to load`, () => {
    // Resolve the real package the same way importFingerprint does, then poison its load.
    const target = require.resolve('expo/fingerprint', { paths: [__dirname] });
    jest.doMock(target, () => {
      throw new SyntaxError('Unexpected token — corrupted install');
    });
    try {
      // A load failure must surface instead of being misreported as "not installed" (null).
      expect(() => importFingerprint(__dirname)).toThrow('Unexpected token');
    } finally {
      jest.dontMock(target);
    }
  });
});

describe(getNativeDirectoryStaleness, () => {
  const current = { sources: [configSource], fingerprintVersion: '0.20.6' };

  it(`is not applicable without a native directory — nothing to regenerate`, () => {
    expect(getNativeDirectoryStaleness(projectRoot, 'ios', current)).toEqual({
      status: 'not-applicable',
      changes: [],
    });
  });

  it(`reads as unknown with a native directory but no marker (bare project)`, () => {
    vol.fromJSON({ [`${projectRoot}/ios/Podfile`]: '' });
    expect(getNativeDirectoryStaleness(projectRoot, 'ios', current)).toEqual({
      status: 'unknown',
      changes: [],
    });
  });

  it(`compares against the marker when the native directory exists`, () => {
    vol.fromJSON({
      [`${projectRoot}/ios/Podfile`]: '',
      [getPrebuildFingerprintMarkerPath(projectRoot, 'ios')]: JSON.stringify({
        version: 1,
        platform: 'ios',
        hash: 'marker-hash',
        sources: [{ ...configSource, hash: 'old-config-hash' }],
        fingerprintVersion: '0.20.6',
        createdAt: '2026-08-14T00:00:00.000Z',
      }),
    });
    expect(getNativeDirectoryStaleness(projectRoot, 'ios', current)).toEqual({
      status: 'stale',
      changes: [{ source: 'app config', change: 'changed' }],
    });
  });
});

describe(rebuildCommands, () => {
  it(`names prebuild first when the native directories are stale`, () => {
    expect(rebuildCommands('ios', { prebuildFirst: true })).toEqual([
      'npx expo prebuild -p ios',
      'npx expo run:ios',
    ]);
    expect(rebuildCommands('android', { prebuildFirst: false })).toEqual(['npx expo run:android']);
  });
});
