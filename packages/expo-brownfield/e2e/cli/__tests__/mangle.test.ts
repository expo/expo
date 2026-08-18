import { __testing } from '../../../cli/src/utils/mangle';

const { extractConstants, prefixSelectors, isDistinctiveSelector, buildManglingHeader } = __testing;

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
