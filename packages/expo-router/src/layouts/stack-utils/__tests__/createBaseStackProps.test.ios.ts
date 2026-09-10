import { expectTypeOf } from 'expect-type';

import type {
  NavigationHelpers,
  ParamListBase,
  StackNavigationState,
} from '../../../react-navigation/native';
import { createBaseStackProps } from '../createBaseStackProps';

describe(createBaseStackProps, () => {
  // Only the state fields read by `createBaseStackProps` are relevant to these unit tests.
  const state = {
    key: 'stack-key',
    index: 1,
  } as StackNavigationState<ParamListBase>;

  it('creates a synchronous pop function', () => {
    const dispatchSync = jest.fn();
    const props = createBaseStackProps({
      dispatchSync,
      // `pop` does not read navigation.
      navigation: {} as NavigationHelpers<ParamListBase>,
      state,
    });

    props.pop(2, 'route-key');

    expect(dispatchSync).toHaveBeenCalledTimes(1);
    expect(dispatchSync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'POP',
        payload: { count: 2 },
        source: 'route-key',
        target: 'stack-key',
      })
    );
  });

  it('creates a parent tab press subscription function', () => {
    const unsubscribe = jest.fn();
    const addListener = jest.fn(() => unsubscribe);
    const props = createBaseStackProps({
      dispatchSync: jest.fn(),
      navigation: {
        addListener,
        // The subscription helper only reads `addListener` until the listener fires.
      } as unknown as NavigationHelpers<ParamListBase>,
      state,
    });

    expect(props.subscribePopToTopOnParentTabPress()).toBe(unsubscribe);
    expect(addListener).toHaveBeenCalledWith('tabPress', expect.any(Function));
  });

  it('only requires the dependencies used by base stack props', () => {
    expectTypeOf(createBaseStackProps).parameter(0).toEqualTypeOf<{
      dispatchSync: (
        action: Parameters<NavigationHelpers<ParamListBase>['dispatchSync']>[0]
      ) => void;
      navigation: NavigationHelpers<ParamListBase>;
      state: StackNavigationState<ParamListBase>;
    }>();
  });
});
