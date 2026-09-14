import { expectTypeOf } from 'expect-type';

import type {
  NavigationHelpers,
  ParamListBase,
  StackNavigationState,
} from '../../../react-navigation/native';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../../../standard-navigation/types';
import { createBaseStackProps } from '../createBaseStackProps';

describe(createBaseStackProps, () => {
  // Only the state fields read by `createBaseStackProps` are relevant to these unit tests.
  const state = {
    key: 'stack-key',
    index: 1,
  } as StackNavigationState<ParamListBase>;
  const dependencies: StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>> =
    {
      dispatch: jest.fn(),
      dispatchSync: jest.fn(),
      isPreloaded: jest.fn(() => false),
      isRemovalPrevented: jest.fn(() => false),
      navigation: {} as NavigationHelpers<ParamListBase>,
      state,
    };

  it('creates a synchronous pop function', () => {
    const dispatchSync = jest.fn();
    const props = createBaseStackProps({
      ...dependencies,
      dispatchSync,
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
      ...dependencies,
      navigation: {
        addListener,
        // The subscription helper only reads `addListener` until the listener fires.
      } as unknown as NavigationHelpers<ParamListBase>,
      state,
    });

    expect(props.subscribePopToTopOnParentTabPress()).toBe(unsubscribe);
    expect(addListener).toHaveBeenCalledWith('tabPress', expect.any(Function));
  });

  it('accepts the standard navigator dependencies', () => {
    expectTypeOf(createBaseStackProps)
      .parameter(0)
      .toEqualTypeOf<
        StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>
      >();
  });

  it('forwards integration state callbacks', () => {
    const props = createBaseStackProps(dependencies);

    expect(props.isPreloaded).toBe(dependencies.isPreloaded);
    expect(props.isRemovalPrevented).toBe(dependencies.isRemovalPrevented);
  });
});
