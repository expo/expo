import { StatusBar as NativeStatusBarWrapper } from '../NativeStatusBarWrapper';
import { StatusBar as ExpoStatusBarIOS } from '../StatusBar';

describe('StatusBar', () => {
  it('is just the native status bar wrapper', () => {
    expect(NativeStatusBarWrapper).toBe(ExpoStatusBarIOS);
  });
});
