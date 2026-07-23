import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { enumerateAllPrebuildModules, enumeratePrebuildModulesRaw } from '../precompiled';

jest.mock('@expo/spawn-async', () =>
  jest.fn(async () => {
    throw new Error('spawnAsync should not be called in these tests');
  })
);

let cwd: string;
let podsDir: string;

const makePrecompiledPod = (name: string): string => {
  const podDir = path.join(podsDir, name);
  fs.mkdirSync(path.join(podDir, `${name}.xcframework`), { recursive: true });
  fs.mkdirSync(path.join(podDir, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(podDir, 'artifacts', `${name}-release.tar.gz`), '');
  return podDir;
};

const makeSharedDepStore = (name: string, flavors: string[]): string => {
  const storeDir = path.join(cwd, 'store', name);
  for (const flavor of flavors) {
    const xcframework = path.join(storeDir, flavor, `${name}.xcframework`);
    fs.mkdirSync(xcframework, { recursive: true });
    fs.writeFileSync(path.join(xcframework, 'Info.plist'), flavor);
  }
  return storeDir;
};

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-precompiled-'));
  podsDir = path.join(cwd, 'ios', 'Pods');
  fs.mkdirSync(podsDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe('pod-built vendored xcframeworks (e.g. ExpoModulesJSI)', () => {
  it('includes Pods/<Pod>/Products/<Pod>.xcframework in the enumerated module set', () => {
    makePrecompiledPod('ExpoModulesCore');
    const jsiXcframework = path.join(
      podsDir,
      'ExpoModulesJSI',
      'Products',
      'ExpoModulesJSI.xcframework'
    );
    fs.mkdirSync(jsiXcframework, { recursive: true });

    const { modules } = enumeratePrebuildModulesRaw(cwd, 'Release');
    const jsi = modules.find((m) => m.name === 'ExpoModulesJSI');
    expect(jsi).toBeDefined();
    expect(jsi!.xcframeworkPath).toBe(jsiXcframework);
  });

  it('ignores pods without a matching Products/<Pod>.xcframework', () => {
    makePrecompiledPod('ExpoModulesCore');
    fs.mkdirSync(path.join(podsDir, 'SomePod', 'Products'), { recursive: true });

    const { modules } = enumeratePrebuildModulesRaw(cwd, 'Release');
    expect(modules.map((m) => m.name)).toEqual(['ExpoModulesCore']);
  });
});

describe('symlinked shared SPM-dep xcframeworks', () => {
  it('resolves symlinks to real paths and corrects the flavor to the requested configuration', () => {
    const podDir = makePrecompiledPod('ExpoImage');
    const storeDir = makeSharedDepStore('SDWebImage', ['debug', 'release']);
    // Autolinking stages shared deps as symlinks into the flavor selected at pod-install time.
    fs.symlinkSync(
      path.join(storeDir, 'debug', 'SDWebImage.xcframework'),
      path.join(podDir, 'SDWebImage.xcframework')
    );

    const { modules } = enumeratePrebuildModulesRaw(cwd, 'Release');
    const dep = modules.find((m) => m.name === 'SDWebImage');
    expect(dep).toBeDefined();
    expect(dep!.xcframeworkPath).toBe(
      fs.realpathSync(path.join(storeDir, 'release', 'SDWebImage.xcframework'))
    );
    expect(fs.lstatSync(dep!.xcframeworkPath).isSymbolicLink()).toBe(false);
  });

  it('reports a flavor mismatch when the requested flavor is not available', () => {
    const podDir = makePrecompiledPod('ExpoImage');
    const storeDir = makeSharedDepStore('SDWebImage', ['debug']);
    fs.symlinkSync(
      path.join(storeDir, 'debug', 'SDWebImage.xcframework'),
      path.join(podDir, 'SDWebImage.xcframework')
    );

    const { flavorMismatches } = enumeratePrebuildModulesRaw(cwd, 'Release');
    expect(flavorMismatches.map((m) => m.name)).toEqual(['SDWebImage']);
  });

  it('fails the strict enumeration on a flavor mismatch', () => {
    const podDir = makePrecompiledPod('ExpoImage');
    const storeDir = makeSharedDepStore('SDWebImage', ['debug']);
    fs.symlinkSync(
      path.join(storeDir, 'debug', 'SDWebImage.xcframework'),
      path.join(podDir, 'SDWebImage.xcframework')
    );

    jest.spyOn(console, 'error').mockImplementation(() => {});
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    expect(() => enumerateAllPrebuildModules(cwd, 'Release')).toThrow('process.exit');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('does not fail on a flavor mismatch for host-provided frameworks', () => {
    const podDir = makePrecompiledPod('ExpoImage');
    const storeDir = makeSharedDepStore('SDWebImage', ['debug']);
    fs.symlinkSync(
      path.join(storeDir, 'debug', 'SDWebImage.xcframework'),
      path.join(podDir, 'SDWebImage.xcframework')
    );

    const modules = enumerateAllPrebuildModules(cwd, 'Release', ['SDWebImage']);
    expect(modules.map((m) => m.name)).toEqual(['ExpoImage']);
  });
});
