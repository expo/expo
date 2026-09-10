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

  const createDeps = (
    overrides: Partial<
      StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>
    > = {}
  ): StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>> => ({
    dispatch: jest.fn(),
    dispatchSync: jest.fn(),
    isPreloaded: jest.fn(),
    isRemovalPrevented: jest.fn(),
    navigation: {} as NavigationHelpers<ParamListBase>,
    state,
    ...overrides,
  });

  it('creates a synchronous pop function', () => {
    const dispatchSync = jest.fn();
    const props = createBaseStackProps(createDeps({ dispatchSync }));

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
    const props = createBaseStackProps(
      createDeps({
        navigation: {
          addListener,
          // The subscription helper only reads `addListener` until the listener fires.
        } as unknown as NavigationHelpers<ParamListBase>,
      })
    );

    expect(props.subscribePopToTopOnParentTabPress()).toBe(unsubscribe);
    expect(addListener).toHaveBeenCalledWith('tabPress', expect.any(Function));
  });

  it('accepts all navigator props factory dependencies', () => {
    expectTypeOf(createBaseStackProps)
      .parameter(0)
      .toEqualTypeOf<
        StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>
      >();
  });

  it('forwards integration state callbacks', () => {
    const dependencies = createDeps();
    const props = createBaseStackProps(dependencies);

    expect(props.isPreloaded).toBe(dependencies.isPreloaded);
    expect(props.isRemovalPrevented).toBe(dependencies.isRemovalPrevented);
  });
});
