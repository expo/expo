import {
  buildVersionPrefix,
  getArtifactBase,
  getArtifactBases,
  getArtifactDirSuffix,
  getArtifactSuffixes,
  getRemoteArtifactKey,
  getSharedSpmDepBases,
  getSharedSpmDepSuffix,
  PREBUILT_FLAVORS,
  type PrebuiltFlavor,
} from '../prebuiltArtifactPaths';

const LOCAL_BUILDS_PATH = '/builds';
const PACKAGE_ROOT = '/repo/packages/expo-image';
const VERSION_PREFIX = '1.2.3/0.83.0/1.0.0';

describe('PREBUILT_FLAVORS', () => {
  it('covers both flavors, because consumers copy both at once', () => {
    expect(PREBUILT_FLAVORS).toEqual(['debug', 'release']);
  });
});

describe(buildVersionPrefix, () => {
  it('joins the three versions with slashes', () => {
    expect(buildVersionPrefix('1.2.3', '0.83.0', '1.0.0')).toBe('1.2.3/0.83.0/1.0.0');
  });

  const missingVersionCases: [
    string,
    string | null | undefined,
    string | null | undefined,
    string | null | undefined,
  ][] = [
    ['package version', null, '0.83.0', '1.0.0'],
    ['react native version', '1.2.3', undefined, '1.0.0'],
    ['hermes version', '1.2.3', '0.83.0', ''],
  ];

  it.each(missingVersionCases)('returns null when the %s is missing', (_label, pkg, rn, hermes) => {
    expect(buildVersionPrefix(pkg, rn, hermes)).toBeNull();
  });
});

describe(getArtifactBase, () => {
  it('appends the output directory to an already-resolved build path', () => {
    expect(getArtifactBase(`${LOCAL_BUILDS_PATH}/expo-image`)).toBe(
      `${LOCAL_BUILDS_PATH}/expo-image/output`
    );
  });

  it('appends the version prefix below the output directory', () => {
    expect(getArtifactBase(`${LOCAL_BUILDS_PATH}/react-native-skia`, VERSION_PREFIX)).toBe(
      `${LOCAL_BUILDS_PATH}/react-native-skia/output/${VERSION_PREFIX}`
    );
  });

  it.each([null, undefined, ''])('ignores a %p version prefix', (versionPrefix) => {
    expect(getArtifactBase(`${LOCAL_BUILDS_PATH}/expo-image`, versionPrefix)).toBe(
      `${LOCAL_BUILDS_PATH}/expo-image/output`
    );
  });

  it('keeps both segments of a scoped package name in the build path', () => {
    expect(getArtifactBase(`${LOCAL_BUILDS_PATH}/@expo/ui`)).toBe(
      `${LOCAL_BUILDS_PATH}/@expo/ui/output`
    );
  });

  it('accepts any build path, such as a package-local one', () => {
    expect(getArtifactBase(`${PACKAGE_ROOT}/.expo-prebuild`)).toBe(
      `${PACKAGE_ROOT}/.expo-prebuild/output`
    );
  });

  it('produces the npm-bundled candidate of getArtifactBases', () => {
    expect(getArtifactBase(`${PACKAGE_ROOT}/prebuilds`)).toBe(`${PACKAGE_ROOT}/prebuilds/output`);
    expect(
      getArtifactBases({
        type: 'internal',
        npmPackage: 'expo-image',
        packageRoot: PACKAGE_ROOT,
        localBuildsPath: LOCAL_BUILDS_PATH,
      })
    ).toContain(`${PACKAGE_ROOT}/prebuilds/output`);
  });
});

describe(getArtifactBases, () => {
  it('puts the local builds dir before the npm-bundled dir for internal packages', () => {
    expect(
      getArtifactBases({
        type: 'internal',
        npmPackage: 'expo-image',
        packageRoot: PACKAGE_ROOT,
        localBuildsPath: LOCAL_BUILDS_PATH,
      })
    ).toEqual([`${LOCAL_BUILDS_PATH}/expo-image/output`, `${PACKAGE_ROOT}/prebuilds/output`]);
  });

  it('lets a custom modules path replace the local builds dir', () => {
    expect(
      getArtifactBases({
        type: 'internal',
        npmPackage: 'expo-image',
        packageRoot: PACKAGE_ROOT,
        customModulesPath: '/custom',
        localBuildsPath: LOCAL_BUILDS_PATH,
      })
    ).toEqual(['/custom/expo-image/output', `${PACKAGE_ROOT}/prebuilds/output`]);
  });

  it('omits the local builds base when there is no local builds path', () => {
    const bases = getArtifactBases({
      type: 'internal',
      npmPackage: 'expo-image',
      packageRoot: PACKAGE_ROOT,
      localBuildsPath: null,
    });
    expect(bases).toEqual([`${PACKAGE_ROOT}/prebuilds/output`]);
    expect(bases.join('\n')).not.toMatch(/null|undefined/);
  });

  it('keeps both segments of a scoped package name', () => {
    expect(
      getArtifactBases({
        type: 'internal',
        npmPackage: '@expo/ui',
        packageRoot: '/repo/packages/expo-ui',
        localBuildsPath: LOCAL_BUILDS_PATH,
      })[0]
    ).toBe(`${LOCAL_BUILDS_PATH}/@expo/ui/output`);
  });

  it('orders versioned before flat for external packages', () => {
    expect(
      getArtifactBases({
        type: 'external',
        npmPackage: 'react-native-skia',
        packageRoot: '/app/node_modules/react-native-skia',
        localBuildsPath: LOCAL_BUILDS_PATH,
        versionPrefix: VERSION_PREFIX,
      })
    ).toEqual([
      `${LOCAL_BUILDS_PATH}/react-native-skia/output/${VERSION_PREFIX}`,
      `/app/node_modules/react-native-skia/prebuilds/output/${VERSION_PREFIX}`,
      '/app/node_modules/react-native-skia/prebuilds/output',
    ]);
  });

  it('drops the versioned entries for external packages without a version prefix', () => {
    expect(
      getArtifactBases({
        type: 'external',
        npmPackage: 'react-native-skia',
        packageRoot: '/app/node_modules/react-native-skia',
        localBuildsPath: LOCAL_BUILDS_PATH,
        versionPrefix: null,
      })
    ).toEqual([
      `${LOCAL_BUILDS_PATH}/react-native-skia/output`,
      '/app/node_modules/react-native-skia/prebuilds/output',
    ]);
  });
});

describe(getArtifactDirSuffix, () => {
  it('is the flavor directory and its xcframeworks subdirectory', () => {
    expect(getArtifactDirSuffix('debug')).toBe('debug/xcframeworks');
    expect(getArtifactDirSuffix('release')).toBe('release/xcframeworks');
  });

  it.each(PREBUILT_FLAVORS)(
    'is the directory the %s product suffixes are relative to',
    (flavor) => {
      expect(getArtifactSuffixes('ExpoImage', flavor).dir).toBe(`${flavor}/xcframeworks`);
    }
  );
});

describe(getArtifactSuffixes, () => {
  it('describes the debug layout', () => {
    expect(getArtifactSuffixes('ExpoImage', 'debug')).toEqual({
      dir: 'debug/xcframeworks',
      framework: 'debug/xcframeworks/ExpoImage.xcframework',
      tarball: 'debug/xcframeworks/ExpoImage.tar.gz',
    });
  });

  it('describes the release layout', () => {
    expect(getArtifactSuffixes('ExpoImage', 'release')).toEqual({
      dir: 'release/xcframeworks',
      framework: 'release/xcframeworks/ExpoImage.xcframework',
      tarball: 'release/xcframeworks/ExpoImage.tar.gz',
    });
  });
});

describe(getRemoteArtifactKey, () => {
  it('includes the version prefix when there is one', () => {
    expect(getRemoteArtifactKey('react-native-skia', VERSION_PREFIX, 'RNSkia', 'release')).toBe(
      `react-native-skia/output/${VERSION_PREFIX}/release/xcframeworks/RNSkia.tar.gz`
    );
  });

  it('omits the version prefix when there is none', () => {
    expect(getRemoteArtifactKey('react-native-skia', null, 'RNSkia', 'debug')).toBe(
      'react-native-skia/output/debug/xcframeworks/RNSkia.tar.gz'
    );
  });

  it('keeps forward slashes and both segments of a scoped package name', () => {
    const key = getRemoteArtifactKey('@expo/ui', VERSION_PREFIX, 'ExpoUI', 'release');
    expect(key).toBe(`@expo/ui/output/${VERSION_PREFIX}/release/xcframeworks/ExpoUI.tar.gz`);
    expect(key).not.toContain('\\');
  });
});

describe(getSharedSpmDepBases, () => {
  it('orders custom, local builds, then npm-bundled, and does not let the custom path replace the local builds one', () => {
    expect(
      getSharedSpmDepBases('SDWebImage', {
        packageRoot: PACKAGE_ROOT,
        customModulesPath: '/custom',
        localBuildsPath: LOCAL_BUILDS_PATH,
      })
    ).toEqual([
      '/custom/.spm-deps/SDWebImage',
      `${LOCAL_BUILDS_PATH}/.spm-deps/SDWebImage`,
      `${PACKAGE_ROOT}/prebuilds/spm-deps/SDWebImage`,
    ]);
  });

  it('omits candidates whose root is missing', () => {
    expect(getSharedSpmDepBases('SDWebImage', { localBuildsPath: LOCAL_BUILDS_PATH })).toEqual([
      `${LOCAL_BUILDS_PATH}/.spm-deps/SDWebImage`,
    ]);
    expect(getSharedSpmDepBases('SDWebImage', {})).toEqual([]);
  });
});

describe(getSharedSpmDepSuffix, () => {
  it('has no xcframeworks segment, unlike the product grammar', () => {
    expect(getSharedSpmDepSuffix('SDWebImage', 'debug')).toBe('debug/SDWebImage.xcframework');
    expect(getSharedSpmDepSuffix('SDWebImage', 'release')).toBe('release/SDWebImage.xcframework');
  });
});

describe('candidate lists never contain a relative or placeholder path', () => {
  it('omits the npm-bundled candidate when the package root is missing', () => {
    expect(
      getArtifactBases({
        type: 'internal',
        npmPackage: 'expo-image',
        packageRoot: '',
        localBuildsPath: LOCAL_BUILDS_PATH,
      })
    ).toEqual([`${LOCAL_BUILDS_PATH}/expo-image/output`]);
  });

  it('drops the local builds candidate for external packages under a custom modules path', () => {
    expect(
      getArtifactBases({
        type: 'external',
        npmPackage: 'react-native-skia',
        packageRoot: '/app/node_modules/react-native-skia',
        customModulesPath: '/custom',
        localBuildsPath: LOCAL_BUILDS_PATH,
        versionPrefix: VERSION_PREFIX,
      })
    ).toEqual([
      `/custom/react-native-skia/output/${VERSION_PREFIX}`,
      `/app/node_modules/react-native-skia/prebuilds/output/${VERSION_PREFIX}`,
      '/app/node_modules/react-native-skia/prebuilds/output',
    ]);
  });

  it('rejects a version prefix on an internal package at compile time', () => {
    const bases = getArtifactBases(
      // @ts-expect-error internal packages are never published under a versioned path
      {
        type: 'internal',
        npmPackage: 'expo-image',
        packageRoot: PACKAGE_ROOT,
        localBuildsPath: LOCAL_BUILDS_PATH,
        versionPrefix: VERSION_PREFIX,
      }
    );
    expect(bases).toEqual([
      `${LOCAL_BUILDS_PATH}/expo-image/output`,
      `${PACKAGE_ROOT}/prebuilds/output`,
    ]);
  });
});

describe('PREBUILT_FLAVORS is immutable', () => {
  it('cannot be mutated by a consumer', () => {
    expect(() => (PREBUILT_FLAVORS as PrebuiltFlavor[]).push('debug')).toThrow();
  });
});

describe('getRemoteArtifactKey keeps the version prefix Ruby drops', () => {
  // precompiled_modules.rb:2143-2161 derives this key from the RESOLVED build_output_dir via
  // rindex("<npmPackage>/output"). When resolution fell back to the npm-bundled directory that
  // substring is absent, so Ruby emits an unversioned key pointing at nothing: the remote store is
  // always written with versioned paths. This module emits the versioned key unconditionally.
  it('is unaffected by which base the caller resolved the artifact from', () => {
    expect(getRemoteArtifactKey('react-native-skia', VERSION_PREFIX, 'RNSkia', 'release')).toBe(
      `react-native-skia/output/${VERSION_PREFIX}/release/xcframeworks/RNSkia.tar.gz`
    );
  });
});
