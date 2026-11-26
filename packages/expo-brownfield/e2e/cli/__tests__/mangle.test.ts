import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { __testing, runMangle } from '../../../cli/src/utils/mangle';

const {
  extractConstants,
  prefixSelectors,
  isDistinctiveSelector,
  buildManglingHeader,
  findBinariesToMangle,
} = __testing;

/**
 * Unit tests for the symbol-mangling transform. These cover the parts of the
 * ARG_MAX fix that changed how symbols are turned into `#define`s: dropping
 * symbols that can never fire (or would break) a preprocessor rename, keeping
 * only distinctive selectors, symmetric setter/ivar handling, and rendering the
 * force-included header.
 */
describe('extractConstants', () => {
  it('keeps plain C constants but drops Itanium C++ (`_Z…`) and whitespace symbols', () => {
    const lines = [
      '0000000000000001 S _GoodConst',
      '0000000000000002 T __ZN3fooEv', // Itanium mangled -> `_ZN3fooEv`
      '0000000000000003 S _foo bar', // survived a Swift filter with whitespace
    ];
    expect(extractConstants(lines)).toEqual(['GoodConst']);
  });
});

describe('isDistinctiveSelector', () => {
  it('keeps camelCase and prefixed selectors, drops generic single words', () => {
    expect(isDistinctiveSelector('reactTag')).toBe(true);
    expect(isDistinctiveSelector('sd_extendedObject')).toBe(true);
    expect(isDistinctiveSelector('props')).toBe(false);
    expect(isDistinctiveSelector('load')).toBe(false);
  });
});

describe('prefixSelectors', () => {
  it('renames a setter/getter pair symmetrically and its backing ivar', () => {
    const defines = prefixSelectors('Exp_', ['reactTag', 'setReactTag']);
    expect(defines).toEqual(
      expect.arrayContaining([
        'reactTag=Exp_reactTag',
        'setReactTag=setExp_reactTag',
        '_reactTag=_Exp_reactTag',
      ])
    );
  });

  it('drops a whole property (getter + setter) when the getter is not distinctive', () => {
    expect(prefixSelectors('Exp_', ['props', 'setProps'])).toEqual([]);
  });

  it('renames a plain getter-shaped selector and its ivar, drops non-distinctive plains', () => {
    const defines = prefixSelectors('Exp_', ['reactTag', 'load']);
    expect(defines).toEqual(
      expect.arrayContaining(['reactTag=Exp_reactTag', '_reactTag=_Exp_reactTag'])
    );
    expect(defines.some((d) => d.startsWith('load'))).toBe(false);
  });
});

describe('buildManglingHeader', () => {
  it('guards Objective-C renames behind __OBJC__ and emits `#define OLD NEW`', () => {
    const header = buildManglingHeader(['CFoo=Exp_CFoo'], ['reactTag=Exp_reactTag']);
    expect(header).toContain('#ifndef EXPO_BROWNFIELD_MANGLE_H');
    expect(header).toContain('#define CFoo Exp_CFoo');

    const objcStart = header.indexOf('#ifdef __OBJC__');
    const objcEnd = header.indexOf('#endif', objcStart);
    expect(objcStart).toBeGreaterThan(-1);
    // The selector define lives inside the __OBJC__ guard; the C define does not.
    expect(header.indexOf('#define reactTag Exp_reactTag')).toBeGreaterThan(objcStart);
    expect(header.indexOf('#define reactTag Exp_reactTag')).toBeLessThan(objcEnd);
    expect(header.indexOf('#define CFoo Exp_CFoo')).toBeLessThan(objcStart);
  });
});

describe('findBinariesToMangle', () => {
  it('separates the prebuilt frameworks that Xcode copies to XCFrameworkIntermediates', () => {
    const builtProductsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-brownfield-mangle-'));
    const podLibrary = path.join(builtProductsDir, 'RNScreens', 'libRNScreens.a');
    const prebuiltFramework = path.join(
      builtProductsDir,
      'XCFrameworkIntermediates',
      'React-Core-prebuilt',
      'React.framework'
    );
    fs.mkdirSync(path.dirname(podLibrary), { recursive: true });
    fs.mkdirSync(prebuiltFramework, { recursive: true });
    fs.writeFileSync(podLibrary, '');
    fs.writeFileSync(path.join(prebuiltFramework, 'React'), '');

    expect(findBinariesToMangle(builtProductsDir)).toEqual({
      podBinaries: [podLibrary],
      prebuiltBinaries: [path.join(prebuiltFramework, 'React')],
    });

    fs.rmSync(builtProductsDir, { recursive: true, force: true });
  });
});

describe('runMangle', () => {
  it('patches the pod xcconfigs again when the mangling config is up to date', async () => {
    const podsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-brownfield-mangle-'));
    const xcconfigPath = path.join(podsDir, 'Target Support Files', 'expo-brownfield-mangle.xcconfig');
    const podXcconfigPath = path.join(podsDir, 'Target Support Files', 'Foo', 'Foo.release.xcconfig');
    fs.mkdirSync(path.dirname(podXcconfigPath), { recursive: true });
    fs.writeFileSync(xcconfigPath, 'MANGLED_SPECS_CHECKSUM = abc\n');
    // CocoaPods writes the pod xcconfigs again on each `pod install`.
    fs.writeFileSync(podXcconfigPath, 'OTHER_CFLAGS = $(inherited)\n');

    await runMangle(
      {
        podsProjectPath: path.join(podsDir, 'Pods.xcodeproj'),
        podTargetLabels: ['Foo'],
        podXcconfigPaths: [podXcconfigPath],
        manglePrefix: 'Exp_',
        xcconfigPath,
        specsChecksum: 'abc',
      },
      { verbose: false }
    );

    const patched = fs.readFileSync(podXcconfigPath, 'utf8');
    expect(patched).toContain(`#include "${xcconfigPath}"`);
    expect(patched).toContain('-include "$(MANGLING_HEADER)"');

    fs.rmSync(podsDir, { recursive: true, force: true });
  });
});
