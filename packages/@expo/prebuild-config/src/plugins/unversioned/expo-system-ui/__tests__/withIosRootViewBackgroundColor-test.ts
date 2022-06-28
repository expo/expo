import {
  setRootViewBackgroundColor,
  shouldUseLegacyBehavior,
} from '../withIosRootViewBackgroundColor';

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
      setRootViewBackgroundColor({ backgroundColor: 'dodgerblue' }, {}).RCTRootViewBackgroundColor
    ).toEqual(4280193279);
    expect(
      setRootViewBackgroundColor({ backgroundColor: '#fff000' }, {}).RCTRootViewBackgroundColor
    ).toEqual(4294963200);
  });
  it(`throws on invalid color`, () => {
    expect(() => setRootViewBackgroundColor({ backgroundColor: 'bacon' }, {})).toThrow();
  });
  it(`removes color`, () => {
    expect(
      setRootViewBackgroundColor({}, { RCTRootViewBackgroundColor: 0xfff000 })
        .RCTRootViewBackgroundColor
    ).toBeUndefined();
  });
});
