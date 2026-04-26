import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { enumeratePrecompiledModules } from '../../../cli/src/utils/precompiled';

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
    options: { xcframework?: string; tarballs?: string[] } = {}
  ) => {
    const podDir = path.join(iosDir, 'Pods', pod);
    fs.mkdirSync(podDir, { recursive: true });
    if (options.xcframework) {
      fs.mkdirSync(path.join(podDir, `${options.xcframework}.xcframework`));
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

  it('only matches xcframeworks whose name lines up with the artifact tarballs', () => {
    // Defensive case: an artifacts/ dir from one product sitting next to an unrelated
    // vendored xcframework should not produce a false-positive entry.
    seedPod(tmpDir, 'WeirdPod', {
      xcframework: 'UnrelatedThing',
      tarballs: ['WeirdPod-debug.tar.gz'],
    });

    expect(enumeratePrecompiledModules(tmpDir)).toHaveLength(0);
  });
});
