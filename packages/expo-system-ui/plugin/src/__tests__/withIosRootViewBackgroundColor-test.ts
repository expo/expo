import { setRootViewBackgroundColor } from '../withIosRootViewBackgroundColor';

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
