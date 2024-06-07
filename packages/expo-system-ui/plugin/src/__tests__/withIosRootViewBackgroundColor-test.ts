import { setRootViewBackgroundColor } from '../withIosRootViewBackgroundColor';

jest.mock('resolve-from', () => {
  const path = jest.requireActual('path');
  const expoRoot = path.resolve(__dirname, '../../../../..');
  return {
    // Try to resolve packages from workspace root because all packages are hoisted to the root
    silent: jest.fn().mockImplementation((projectRoot: string, packageName: string) => {
      return path.join(expoRoot, 'node_modules', packageName);
    }),
  };
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
