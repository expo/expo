import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  enumeratePrecompiledModules,
  enumerateSpmDepsXcframeworks,
} from '../../../cli/src/utils/precompiled';

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
});
