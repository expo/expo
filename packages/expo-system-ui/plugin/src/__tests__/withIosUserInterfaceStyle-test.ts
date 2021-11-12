import { getUserInterfaceStyle, setUserInterfaceStyle } from '../withIosUserInterfaceStyle';

describe('user interface style', () => {
  // TODO: should we default to 'Light' just as we do in the client if none is specified?
  it(`returns light if no userInterfaceStyle is provided`, () => {
    expect(getUserInterfaceStyle({})).toBe('light');
  });

  it(`returns the value if provided`, () => {
    expect(getUserInterfaceStyle({ userInterfaceStyle: 'light' })).toBe('light');
  });

  it(`returns the value under the ios key if provided`, () => {
    expect(
      getUserInterfaceStyle({ ios: { userInterfaceStyle: 'light' }, userInterfaceStyle: 'dark' })
    ).toBe('light');
  });

  it(`sets the UIUserInterfaceStyle to the appropriate value if given`, () => {
    expect(setUserInterfaceStyle({ userInterfaceStyle: 'light' }, {})).toMatchObject({
      UIUserInterfaceStyle: 'Light',
    });

    expect(setUserInterfaceStyle({ userInterfaceStyle: 'automatic' }, {})).toMatchObject({
      UIUserInterfaceStyle: 'Automatic',
    });
  });

  // TODO: should we default to 'Light' just as we do in the client if none is specified?
  it(`makes no changes to the infoPlist if the value is invalid`, () => {
    expect(
      setUserInterfaceStyle({ userInterfaceStyle: 'not-a-real-one' as any }, {})
    ).toMatchObject({});
  });
});
