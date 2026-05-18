import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildPodToNpmPackageMap,
  collectDeclaredSpmDeps,
  enumerateBundledSpmDepsXcframeworks,
  enumeratePrecompiledModules,
  enumerateSpmDepsXcframeworks,
} from '../../../cli/src/utils/precompiled';
import type { ModuleXCFramework } from '../../../cli/src/utils/types';

/**
 * Unit tests for the precompiled-modules enumerator. These tests construct a synthetic
 * `ios/Pods/` directory whose layout matches what `Expo::PrecompiledModules.ensure_artifacts`
 * writes during a precompiled `pod install`, and assert the enumerator picks up the right
 * xcframeworks and excludes the React/Hermes/RND triplet that's already covered elsewhere.
 */
describe('enumeratePrecompiledModules', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-precompiled-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const seedPod = (
    iosDir: string,
    pod: string,
    options: { xcframework?: string; xcframeworks?: string[]; tarballs?: string[] } = {}
  ) => {
    const podDir = path.join(iosDir, 'Pods', pod);
    fs.mkdirSync(podDir, { recursive: true });
    const xcframeworks = [
      ...(options.xcframework ? [options.xcframework] : []),
      ...(options.xcframeworks ?? []),
    ];
    for (const xcf of xcframeworks) {
      fs.mkdirSync(path.join(podDir, `${xcf}.xcframework`));
    }
    if (options.tarballs && options.tarballs.length > 0) {
      const artifactsDir = path.join(podDir, 'artifacts');
      fs.mkdirSync(artifactsDir, { recursive: true });
      for (const tarball of options.tarballs) {
        fs.writeFileSync(path.join(artifactsDir, tarball), '');
      }
    }
  };

  it('picks up an Expo module that has both an xcframework and matching artifact tarballs', () => {
    seedPod(tmpDir, 'ExpoModulesCore', {
      xcframework: 'ExpoModulesCore',
      tarballs: ['ExpoModulesCore-debug.tar.gz', 'ExpoModulesCore-release.tar.gz'],
    });

    const modules = enumeratePrecompiledModules(tmpDir);
    expect(modules).toHaveLength(1);
    expect(modules[0]).toMatchObject({
      name: 'ExpoModulesCore',
      mainProduct: 'ExpoModulesCore',
      podDir: path.join(tmpDir, 'Pods', 'ExpoModulesCore'),
      xcframeworkPath: path.join(tmpDir, 'Pods', 'ExpoModulesCore', 'ExpoModulesCore.xcframework'),
    });
  });

  it('excludes the reserved Hermes / React / ReactNativeDependencies pods', () => {
    seedPod(tmpDir, 'hermes-engine', {
      xcframework: 'hermesvm',
      tarballs: ['hermesvm-release.tar.gz'],
    });
    seedPod(tmpDir, 'React-Core-prebuilt', {
      xcframework: 'React',
      tarballs: ['React-release.tar.gz'],
    });
    seedPod(tmpDir, 'ReactNativeDependencies', {
      xcframework: 'ReactNativeDependencies',
      tarballs: ['ReactNativeDependencies-release.tar.gz'],
    });
    seedPod(tmpDir, 'ExpoCrypto', {
      xcframework: 'ExpoCrypto',
      tarballs: ['ExpoCrypto-release.tar.gz'],
    });

    const modules = enumeratePrecompiledModules(tmpDir);
    expect(modules.map((m) => m.name)).toEqual(['ExpoCrypto']);
  });

  it('skips pods missing either the xcframework dir or the artifacts tarball', () => {
    // Vendored pod with no artifacts/ — should be ignored
    seedPod(tmpDir, 'SomeVendoredPod', { xcframework: 'SomeVendoredPod' });
    // Pod with artifacts but no xcframework dir yet (e.g. install bailed out)
    seedPod(tmpDir, 'BrokenPod', { tarballs: ['BrokenPod-debug.tar.gz'] });

    expect(enumeratePrecompiledModules(tmpDir)).toHaveLength(0);
  });

  it('returns an empty list when ios/Pods/ does not exist', () => {
    expect(enumeratePrecompiledModules(tmpDir)).toEqual([]);
  });

  it('only matches pods that have at least one xcframework lining up with the artifact tarballs', () => {
    // Defensive case: an artifacts/ dir from one product sitting next to an unrelated
    // vendored xcframework should not produce a false-positive entry.
    seedPod(tmpDir, 'WeirdPod', {
      xcframework: 'UnrelatedThing',
      tarballs: ['WeirdPod-debug.tar.gz'],
    });

    expect(enumeratePrecompiledModules(tmpDir)).toHaveLength(0);
  });

  it('surfaces sibling SPM-dependency xcframeworks bundled into the same pod', () => {
    // ExpoImage's pod contains its own xcframework plus the SDWebImage / coder xcframeworks
    // it dynamically links against. All of them must end up in the SPM output, otherwise the
    // host app fails at runtime with `Library not loaded: @rpath/SDWebImage.framework/...`.
    seedPod(tmpDir, 'ExpoImage', {
      xcframeworks: [
        'ExpoImage',
        'SDWebImage',
        'SDWebImageSVGCoder',
        'SDWebImageWebPCoder',
        'libavif',
      ],
      tarballs: ['ExpoImage-debug.tar.gz', 'ExpoImage-release.tar.gz'],
    });

    const modules = enumeratePrecompiledModules(tmpDir);
    expect(modules.map((m) => m.name).sort()).toEqual([
      'ExpoImage',
      'SDWebImage',
      'SDWebImageSVGCoder',
      'SDWebImageWebPCoder',
      'libavif',
    ]);
    // Every entry shares the same main product and pod dir so flavor reconcile happens once.
    for (const m of modules) {
      expect(m.mainProduct).toBe('ExpoImage');
      expect(m.podDir).toBe(path.join(tmpDir, 'Pods', 'ExpoImage'));
    }
  });

  it('deduplicates SPM-dependency xcframeworks claimed by multiple pods', () => {
    // Two pods that both bundle SDWebImage — autolinking only vendors it from the first
    // claimant; the SPM output should follow suit and ship one copy.
    seedPod(tmpDir, 'ExpoImage', {
      xcframeworks: ['ExpoImage', 'SDWebImage'],
      tarballs: ['ExpoImage-release.tar.gz'],
    });
    seedPod(tmpDir, 'AnotherImageMod', {
      xcframeworks: ['AnotherImageMod', 'SDWebImage'],
      tarballs: ['AnotherImageMod-release.tar.gz'],
    });

    const modules = enumeratePrecompiledModules(tmpDir);
    const names = modules.map((m) => m.name);
    expect(names.filter((n) => n === 'SDWebImage')).toHaveLength(1);
    expect(names.sort()).toEqual(['AnotherImageMod', 'ExpoImage', 'SDWebImage']);
  });
});

describe('enumerateSpmDepsXcframeworks', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-spmdeps-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const seedSpmDep = (root: string, name: string, flavor: string) => {
    const xcfDir = path.join(root, 'packages/precompile/.build/.spm-deps', name, flavor, `${name}.xcframework`);
    fs.mkdirSync(xcfDir, { recursive: true });
  };

  it('walks up to find packages/precompile/.build/.spm-deps/ and enumerates the requested flavor', () => {
    const repoRoot = tmpDir;
    seedSpmDep(repoRoot, 'SDWebImage', 'release');
    seedSpmDep(repoRoot, 'libavif', 'release');
    seedSpmDep(repoRoot, 'SDWebImage', 'debug');

    // Run from a deep subdirectory to validate the upward walk.
    const cwd = path.join(repoRoot, 'apps', 'tester', 'expo-app');
    fs.mkdirSync(cwd, { recursive: true });

    const found = enumerateSpmDepsXcframeworks(cwd, 'Release', new Set());
    expect(found.map((m) => m.name).sort()).toEqual(['SDWebImage', 'libavif']);
    for (const m of found) {
      expect(m.mainProduct).toBe(m.name);
      expect(m.xcframeworkPath.endsWith(`${m.name}/release/${m.name}.xcframework`)).toBe(true);
    }
  });

  it('skips entries whose name is already claimed by a Pod-level enumeration', () => {
    const repoRoot = tmpDir;
    seedSpmDep(repoRoot, 'SDWebImage', 'release');
    seedSpmDep(repoRoot, 'libavif', 'release');

    const found = enumerateSpmDepsXcframeworks(repoRoot, 'Release', new Set(['SDWebImage']));
    expect(found.map((m) => m.name)).toEqual(['libavif']);
  });

  it('returns empty when no .spm-deps cache is reachable from cwd', () => {
    expect(enumerateSpmDepsXcframeworks(tmpDir, 'Release', new Set())).toEqual([]);
  });

  it('honors EXPO_PRECOMPILED_MODULES_PATH as an override for the cache root', () => {
    seedSpmDep(tmpDir, 'SDWebImage', 'release');
    const overrideRoot = path.join(tmpDir, 'packages/precompile/.build');
    const previous = process.env.EXPO_PRECOMPILED_MODULES_PATH;
    process.env.EXPO_PRECOMPILED_MODULES_PATH = overrideRoot;
    try {
      // cwd points outside any monorepo, but the env var still wins.
      const isolatedCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-isolated-'));
      try {
        const found = enumerateSpmDepsXcframeworks(isolatedCwd, 'Release', new Set());
        expect(found.map((m) => m.name)).toEqual(['SDWebImage']);
      } finally {
        fs.rmSync(isolatedCwd, { recursive: true, force: true });
      }
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
      } else {
        process.env.EXPO_PRECOMPILED_MODULES_PATH = previous;
      }
    }
  });
});

describe('buildPodToNpmPackageMap', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-podmap-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const seedNpmPackage = (
    cwd: string,
    npmName: string,
    spmConfig: object,
    options: { scoped?: boolean } = {}
  ) => {
    const segments = options.scoped ? npmName.split('/') : [npmName];
    const packageDir = path.join(cwd, 'node_modules', ...segments);
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({ name: npmName }));
    fs.writeFileSync(path.join(packageDir, 'spm.config.json'), JSON.stringify(spmConfig));
    return packageDir;
  };

  it('indexes flat and scoped npm packages by their declared podName', () => {
    seedNpmPackage(tmpDir, 'expo-image', {
      products: [{ name: 'ExpoImage', podName: 'ExpoImage', spmPackages: [] }],
    });
    seedNpmPackage(
      tmpDir,
      '@scope/foo',
      { products: [{ name: 'FooKit', podName: 'FooKit', spmPackages: [] }] },
      { scoped: true }
    );

    const map = buildPodToNpmPackageMap(tmpDir);
    expect(map.get('ExpoImage')?.npmPackage).toBe('expo-image');
    expect(map.get('FooKit')?.npmPackage).toBe('@scope/foo');
  });

  it('skips node_modules entries without spm.config.json', () => {
    fs.mkdirSync(path.join(tmpDir, 'node_modules', 'unrelated-lib'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'node_modules', 'unrelated-lib', 'package.json'),
      JSON.stringify({ name: 'unrelated-lib' })
    );

    expect(buildPodToNpmPackageMap(tmpDir).size).toBe(0);
  });

  it('returns an empty map when node_modules does not exist', () => {
    expect(buildPodToNpmPackageMap(tmpDir).size).toBe(0);
  });
});

describe('enumerateBundledSpmDepsXcframeworks', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-bundled-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const seedNpmWithBundle = (
    cwd: string,
    npmName: string,
    podName: string,
    spmDeps: string[],
    flavor: string,
    options: { versioned?: string; missingDeps?: string[] } = {}
  ) => {
    const packageDir = path.join(cwd, 'node_modules', npmName);
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({ name: npmName }));
    fs.writeFileSync(
      path.join(packageDir, 'spm.config.json'),
      JSON.stringify({
        products: [
          {
            name: podName,
            podName,
            spmPackages: spmDeps.map((p) => ({ productName: p })),
          },
        ],
      })
    );
    const layoutBase = options.versioned
      ? path.join(packageDir, 'prebuilds', 'output', options.versioned)
      : path.join(packageDir, 'prebuilds', 'output');
    const xcframeworksDir = path.join(layoutBase, flavor, 'xcframeworks');
    fs.mkdirSync(xcframeworksDir, { recursive: true });
    const skip = new Set(options.missingDeps ?? []);
    for (const dep of spmDeps) {
      if (skip.has(dep)) {
        continue;
      }
      fs.mkdirSync(path.join(xcframeworksDir, `${dep}.xcframework`));
    }
    return packageDir;
  };

  const fakeModule = (name: string, podDir: string): ModuleXCFramework => ({
    name,
    podDir,
    xcframeworkPath: path.join(podDir, `${name}.xcframework`),
    mainProduct: name,
  });

  it('finds bundled SPM-dep xcframeworks under both flat and versioned layouts', () => {
    seedNpmWithBundle(tmpDir, 'expo-image', 'ExpoImage', ['SDWebImage', 'libavif'], 'release', {
      versioned: '1.0.0/0.85.0/1.0.0',
    });
    const podsDir = path.join(tmpDir, 'ios', 'Pods', 'ExpoImage');
    fs.mkdirSync(podsDir, { recursive: true });

    const map = buildPodToNpmPackageMap(tmpDir);
    const found = enumerateBundledSpmDepsXcframeworks(
      [fakeModule('ExpoImage', podsDir)],
      map,
      'Release',
      new Set(['ExpoImage'])
    );

    expect(found.map((m) => m.name).sort()).toEqual(['SDWebImage', 'libavif']);
    for (const m of found) {
      expect(m.xcframeworkPath).toContain(path.join('1.0.0/0.85.0/1.0.0', 'release'));
    }
  });

  it('skips deps already covered by the existingNames set', () => {
    seedNpmWithBundle(tmpDir, 'expo-image', 'ExpoImage', ['SDWebImage', 'libavif'], 'release');
    const podsDir = path.join(tmpDir, 'ios', 'Pods', 'ExpoImage');
    fs.mkdirSync(podsDir, { recursive: true });

    const map = buildPodToNpmPackageMap(tmpDir);
    const found = enumerateBundledSpmDepsXcframeworks(
      [fakeModule('ExpoImage', podsDir)],
      map,
      'Release',
      new Set(['ExpoImage', 'SDWebImage'])
    );
    expect(found.map((m) => m.name)).toEqual(['libavif']);
  });

  it('ignores xcframeworks that exist only under a different flavor', () => {
    seedNpmWithBundle(tmpDir, 'expo-image', 'ExpoImage', ['SDWebImage'], 'debug');
    const podsDir = path.join(tmpDir, 'ios', 'Pods', 'ExpoImage');
    fs.mkdirSync(podsDir, { recursive: true });

    const map = buildPodToNpmPackageMap(tmpDir);
    const found = enumerateBundledSpmDepsXcframeworks(
      [fakeModule('ExpoImage', podsDir)],
      map,
      'Release',
      new Set(['ExpoImage'])
    );
    expect(found).toEqual([]);
  });

  it('omits deps the package declares but failed to actually bundle (defers to completeness check)', () => {
    seedNpmWithBundle(tmpDir, 'expo-image', 'ExpoImage', ['SDWebImage', 'libavif'], 'release', {
      missingDeps: ['libavif'],
    });
    const podsDir = path.join(tmpDir, 'ios', 'Pods', 'ExpoImage');
    fs.mkdirSync(podsDir, { recursive: true });

    const map = buildPodToNpmPackageMap(tmpDir);
    const found = enumerateBundledSpmDepsXcframeworks(
      [fakeModule('ExpoImage', podsDir)],
      map,
      'Release',
      new Set(['ExpoImage'])
    );
    expect(found.map((m) => m.name)).toEqual(['SDWebImage']);
  });
});

describe('collectDeclaredSpmDeps', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-declared-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('aggregates and dedupes declared SPM dep names across enumerated pods', () => {
    fs.mkdirSync(path.join(tmpDir, 'node_modules', 'expo-image'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'node_modules', 'expo-image', 'package.json'),
      JSON.stringify({ name: 'expo-image' })
    );
    fs.writeFileSync(
      path.join(tmpDir, 'node_modules', 'expo-image', 'spm.config.json'),
      JSON.stringify({
        products: [
          {
            name: 'ExpoImage',
            podName: 'ExpoImage',
            spmPackages: [{ productName: 'SDWebImage' }, { productName: 'libavif' }],
          },
        ],
      })
    );

    const podsDir = path.join(tmpDir, 'ios', 'Pods', 'ExpoImage');
    fs.mkdirSync(podsDir, { recursive: true });
    const map = buildPodToNpmPackageMap(tmpDir);

    const declared = collectDeclaredSpmDeps(
      [
        {
          name: 'ExpoImage',
          podDir: podsDir,
          xcframeworkPath: path.join(podsDir, 'ExpoImage.xcframework'),
          mainProduct: 'ExpoImage',
        },
      ],
      map
    );
    expect(declared.map((d) => d.name).sort()).toEqual(['SDWebImage', 'libavif']);
    for (const d of declared) {
      expect(d.declaringPod).toBe('expo-image');
    }
  });
});
