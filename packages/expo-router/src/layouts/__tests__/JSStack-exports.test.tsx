import * as VendoredStack from '../../react-navigation/stack';
import * as JSStackEntry from '../JSStack';

describe('expo-router/js-stack re-exports', () => {
  it('re-exports every value from ../react-navigation/stack', () => {
    const missing = Object.keys(VendoredStack).filter((key) => !(key in JSStackEntry));
    expect(missing).toEqual([]);
  });

  it('exports the Stack navigator with its static components', () => {
    expect(JSStackEntry.Stack).toBeDefined();
    expect(JSStackEntry.default).toBe(JSStackEntry.Stack);
    expect(JSStackEntry.Stack.Screen).toBeDefined();
    expect(JSStackEntry.Stack.Protected).toBeDefined();
  });
});
