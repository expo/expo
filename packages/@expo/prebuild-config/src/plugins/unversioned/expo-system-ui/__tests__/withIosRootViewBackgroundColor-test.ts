import {
  setRootViewBackgroundColor,
  shouldUseLegacyBehavior,
} from '../withIosRootViewBackgroundColor';

jest.mock('resolve-from', () => {
  const path = jest.requireActual('path');
  const expoRoot = path.resolve(__dirname, '../../../../../../../..');
  return {
    // Try to resolve packages from workspace root because all packages are hoisted to the root
    silent: jest.fn().mockImplementation((projectRoot: string, packageName: string) => {
      return path.join(expoRoot, 'node_modules', packageName);
    }),
  };
});

describe(shouldUseLegacyBehavior, () => {
  it(`should use legacy behavior in SDK –43`, () => {
    expect(shouldUseLegacyBehavior({ sdkVersion: '43.0.0' })).toBe(true);
    expect(shouldUseLegacyBehavior({ sdkVersion: '42.0.0' })).toBe(true);
    expect(shouldUseLegacyBehavior({ sdkVersion: '31.0.0' })).toBe(true);
  });
  it(`should not use legacy behavior in SDK +44`, () => {
    expect(shouldUseLegacyBehavior({ sdkVersion: '44.0.0' })).toBe(false);
    expect(shouldUseLegacyBehavior({ sdkVersion: '46.0.0' })).toBe(false);
    expect(shouldUseLegacyBehavior({ sdkVersion: '100.0.0' })).toBe(false);
  });
  it(`should not use legacy behavior when UNVERSIONED`, () => {
    expect(shouldUseLegacyBehavior({ sdkVersion: 'UNVERSIONED' })).toBe(false);
  });
  it(`should not use legacy behavior when undefined`, () => {
    expect(shouldUseLegacyBehavior({})).toBe(false);
  });
});

describe(setRootViewBackgroundColor, () => {
  it(`sets color`, () => {
    expect(
      setRootViewBackgroundColor('/app', { backgroundColor: 'dodgerblue' }, {})
        .RCTRootViewBackgroundColor
    ).toEqual(4280193279);
    expect(
      setRootViewBackgroundColor('/app', { backgroundColor: '#fff000' }, {})
        .RCTRootViewBackgroundColor
    ).toEqual(4294963200);
  });
  it(`throws on invalid color`, () => {
    expect(() => setRootViewBackgroundColor('/app', { backgroundColor: 'bacon' }, {})).toThrow();
  });
  it(`removes color`, () => {
    expect(
      setRootViewBackgroundColor('/app', {}, { RCTRootViewBackgroundColor: 0xfff000 })
        .RCTRootViewBackgroundColor
    ).toBeUndefined();
  });
});
