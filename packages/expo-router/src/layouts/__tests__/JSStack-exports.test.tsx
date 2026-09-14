import * as RouterEntry from '../../exports';
import * as NativeStackEntry from '../../react-navigation/native-stack';
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

  it('exports a single factory for the JS stack integration props', () => {
    expect(JSStackEntry.unstable_createPropsForJSStack).toBeDefined();
    expect(JSStackEntry.unstable_createStandardStackNavigator).toBeDefined();
    expect('createPropsForJSStack' in JSStackEntry).toBe(false);
    expect('createStandardStackNavigator' in JSStackEntry).toBe(false);
    expect('makeRestoreRouteAction' in JSStackEntry).toBe(false);
    expect('makePopAction' in NativeStackEntry).toBe(false);
    expect('subscribePopToTopOnParentTabPress' in RouterEntry).toBe(false);
  });

  it('forwards the canonical removal-prevention callback', () => {
    const isRemovalPrevented = jest.fn(() => false);
    const props = JSStackEntry.unstable_createPropsForJSStack({
      dispatch: jest.fn(),
      dispatchSync: jest.fn(),
      isPreloaded: jest.fn(() => false),
      isRemovalPrevented,
      // The adapter only captures navigation in a callback that this test does not invoke.
      navigation: {} as never,
      state: {
        stale: false,
        type: 'stack',
        key: 'stack',
        index: 0,
        routeKeySeq: 0,
        routeNames: [],
        routes: [],
      },
    });

    expect(props.isRemovalPrevented).toBe(isRemovalPrevented);
  });
});
