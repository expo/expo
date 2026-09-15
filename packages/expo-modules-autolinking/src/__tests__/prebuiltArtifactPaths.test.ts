import {
  buildVersionPrefix,
  getArtifactBase,
  getArtifactBases,
  getArtifactDirSuffix,
  getArtifactSuffixes,
  getPackageBuildDir,
  getRemoteArtifactKey,
  getSharedSpmDepBases,
  getSharedSpmDepsRoot,
  getSharedSpmDepSuffix,
  getMonorepoBuildDir,
  PREBUILT_FLAVORS,
  type PrebuiltFlavor,
} from '../prebuiltArtifactPaths';

const REPO_ROOT = '/repo';
const MONOREPO_BASE = `${REPO_ROOT}/packages/precompile/.build`;
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

describe(getMonorepoBuildDir, () => {
  it('is the precompile build directory of a repo checkout', () => {
    expect(getMonorepoBuildDir(REPO_ROOT)).toBe('/repo/packages/precompile/.build');
  });
});

describe(getPackageBuildDir, () => {
  it('is the directory the monorepo builds one package under', () => {
    expect(getPackageBuildDir(REPO_ROOT, 'expo-image')).toBe(
      '/repo/packages/precompile/.build/expo-image'
    );
  });

  it('keeps both segments of a scoped package name', () => {
    expect(getPackageBuildDir(REPO_ROOT, '@expo/ui')).toBe(
      '/repo/packages/precompile/.build/@expo/ui'
    );
  });

  it('is the build path the monorepo candidate of getArtifactBases resolves artifacts under', () => {
    expect(
      getArtifactBases({
        type: 'internal',
        npmPackage: '@expo/ui',
        packageRoot: '/repo/packages/expo-ui',
        repoRoot: REPO_ROOT,
      })
    ).toContain('/repo/packages/precompile/.build/@expo/ui/output');
  });
});

describe(getArtifactBase, () => {
  it('appends the output directory to an already-resolved build path', () => {
    expect(getArtifactBase(`${MONOREPO_BASE}/expo-image`)).toBe(
      `${MONOREPO_BASE}/expo-image/output`
    );
  });

  it('appends the version prefix below the output directory', () => {
    expect(getArtifactBase(`${MONOREPO_BASE}/react-native-skia`, VERSION_PREFIX)).toBe(
      `${MONOREPO_BASE}/react-native-skia/output/${VERSION_PREFIX}`
    );
  });

  it.each([null, undefined, ''])('ignores a %p version prefix', (versionPrefix) => {
    expect(getArtifactBase(`${MONOREPO_BASE}/expo-image`, versionPrefix)).toBe(
      `${MONOREPO_BASE}/expo-image/output`
    );
  });

  it('keeps both segments of a scoped package name in the build path', () => {
    expect(getArtifactBase(`${MONOREPO_BASE}/@expo/ui`)).toBe(`${MONOREPO_BASE}/@expo/ui/output`);
  });

  it('accepts a build path outside the monorepo, such as a package-local one', () => {
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
        repoRoot: REPO_ROOT,
      })
    ).toContain(`${PACKAGE_ROOT}/prebuilds/output`);
  });
});

describe(getArtifactBases, () => {
  it('puts the monorepo build dir before the npm-bundled dir for internal packages', () => {
    expect(
      getArtifactBases({
        type: 'internal',
        npmPackage: 'expo-image',
        packageRoot: PACKAGE_ROOT,
        repoRoot: REPO_ROOT,
      })
    ).toEqual([`${MONOREPO_BASE}/expo-image/output`, `${PACKAGE_ROOT}/prebuilds/output`]);
  });

  it('lets a custom modules path replace the monorepo build dir', () => {
    expect(
      getArtifactBases({
        type: 'internal',
        npmPackage: 'expo-image',
        packageRoot: PACKAGE_ROOT,
        customModulesPath: '/custom',
        repoRoot: REPO_ROOT,
      })
    ).toEqual(['/custom/expo-image/output', `${PACKAGE_ROOT}/prebuilds/output`]);
  });

  it('omits the monorepo base when there is no repo root', () => {
    const bases = getArtifactBases({
      type: 'internal',
      npmPackage: 'expo-image',
      packageRoot: PACKAGE_ROOT,
      repoRoot: null,
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
        repoRoot: REPO_ROOT,
      })[0]
    ).toBe(`${MONOREPO_BASE}/@expo/ui/output`);
  });

  it('orders versioned before flat for external packages', () => {
    expect(
      getArtifactBases({
        type: 'external',
        npmPackage: 'react-native-skia',
        packageRoot: '/app/node_modules/react-native-skia',
        repoRoot: REPO_ROOT,
        versionPrefix: VERSION_PREFIX,
      })
    ).toEqual([
      `${MONOREPO_BASE}/react-native-skia/output/${VERSION_PREFIX}`,
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
        repoRoot: REPO_ROOT,
        versionPrefix: null,
      })
    ).toEqual([
      `${MONOREPO_BASE}/react-native-skia/output`,
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

describe(getSharedSpmDepsRoot, () => {
  it('is the shared dependency directory of the monorepo build dir', () => {
    expect(getSharedSpmDepsRoot(REPO_ROOT)).toBe(`${MONOREPO_BASE}/.spm-deps`);
  });

  it('is the monorepo candidate of getSharedSpmDepBases without the dep name', () => {
    expect(getSharedSpmDepsRoot(REPO_ROOT)).toBe(`${MONOREPO_BASE}/.spm-deps`);
    expect(getSharedSpmDepBases('SDWebImage', { repoRoot: REPO_ROOT })).toEqual([
      `${MONOREPO_BASE}/.spm-deps/SDWebImage`,
    ]);
  });
});

describe(getSharedSpmDepBases, () => {
  it('orders custom, monorepo, then npm-bundled, and does not let the custom path replace the monorepo one', () => {
    expect(
      getSharedSpmDepBases('SDWebImage', {
        packageRoot: PACKAGE_ROOT,
        customModulesPath: '/custom',
        repoRoot: REPO_ROOT,
      })
    ).toEqual([
      '/custom/.spm-deps/SDWebImage',
      `${MONOREPO_BASE}/.spm-deps/SDWebImage`,
      `${PACKAGE_ROOT}/prebuilds/spm-deps/SDWebImage`,
    ]);
  });

  it('omits candidates whose root is missing', () => {
    expect(getSharedSpmDepBases('SDWebImage', { repoRoot: REPO_ROOT })).toEqual([
      `${MONOREPO_BASE}/.spm-deps/SDWebImage`,
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
        repoRoot: REPO_ROOT,
      })
    ).toEqual([`${MONOREPO_BASE}/expo-image/output`]);
  });

  it('drops the monorepo candidate for external packages under a custom modules path', () => {
    expect(
      getArtifactBases({
        type: 'external',
        npmPackage: 'react-native-skia',
        packageRoot: '/app/node_modules/react-native-skia',
        customModulesPath: '/custom',
        repoRoot: REPO_ROOT,
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
        repoRoot: REPO_ROOT,
        versionPrefix: VERSION_PREFIX,
      }
    );
    expect(bases).toEqual([
      `${MONOREPO_BASE}/expo-image/output`,
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
