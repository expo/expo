import { getWindowSoftInputModeMode } from '../WindowSoftInputMode';

describe(getWindowSoftInputModeMode, () => {
  it(`maps custom values`, () => {
    expect(getWindowSoftInputModeMode({ android: { softwareKeyboardLayoutMode: 'pan' } })).toBe(
      'adjustPan'
    );
    expect(getWindowSoftInputModeMode({ android: { softwareKeyboardLayoutMode: 'resize' } })).toBe(
      'adjustResize'
    );
  });
  it(`defaults to adjustResize`, () => {
    expect(getWindowSoftInputModeMode({})).toBe('adjustResize');
  });
  it(`allows unmapped values`, () => {
    expect(
      getWindowSoftInputModeMode({
        android: {
          // @ts-ignore
          softwareKeyboardLayoutMode: 'completely_invalid_value__bacon',
        },
      })
    ).toBe('completely_invalid_value__bacon');
  });
});
