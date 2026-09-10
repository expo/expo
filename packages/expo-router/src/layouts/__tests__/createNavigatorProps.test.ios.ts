import { expectTypeOf } from 'expect-type';

import { createBaseTabProps, createNativeStackProps } from '../../exports';
import { createNativeTabsProps } from '../../native-tabs';
import type { NavigationHelpers, ParamListBase } from '../../react-navigation/native';
import type { StackNavigationState, TabNavigationState } from '../../react-navigation/routers';
import type { StackNavigatorCreateProps } from '../../react-navigation/stack/navigators/createStackNavigator';
import { createJSStackProps } from '../JSStack';
import { createJSTabsProps } from '../Tabs';
import { createJSTopTabsProps } from '../TopTabs';

describe('navigator props helpers', () => {
  const tabState = {
    key: 'tabs-key',
    index: 0,
    routeNames: ['index', 'settings'],
    routes: [
      { key: 'index-key', name: 'index' },
      {
        key: 'settings-key',
        name: 'settings',
        state: { key: 'settings-stack-key' },
      },
    ],
  } as TabNavigationState<ParamListBase>;

  it('creates shared tab route names and preload props', () => {
    const dispatch = jest.fn();
    const props = createBaseTabProps({ dispatch, state: tabState });

    props.preload('settings');

    expect(props.routeNames).toBe(tabState.routeNames);
    expect(dispatch).toHaveBeenCalledWith({ type: 'PRELOAD', payload: { name: 'settings' } });
  });

  it('creates JS tabs props that pop a nested stack', () => {
    const dispatch = jest.fn();
    const props = createJSTabsProps({ dispatch, state: tabState });

    props.popNestedStackToTop('settings-key');

    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'POP_TO_TOP',
      target: 'settings-stack-key',
    });
  });

  it('does not pop a missing nested stack', () => {
    const dispatch = jest.fn();
    const props = createJSTabsProps({ dispatch, state: tabState });

    props.popNestedStackToTop('index-key');

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('creates synchronous top tabs navigation props', () => {
    const dispatchSync = jest.fn();
    const props = createJSTopTabsProps({
      dispatch: jest.fn(),
      dispatchSync,
      state: tabState,
    });

    props.navigateToTabSync('settings', { section: 'account' });

    expect(dispatchSync).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: { name: 'settings', params: { section: 'account' } },
    });
  });

  it('creates synchronous native tabs navigation props', () => {
    const dispatchSync = jest.fn();
    const props = createNativeTabsProps({
      dispatch: jest.fn(),
      dispatchSync,
      state: tabState,
    });

    props.navigateSync('settings');

    expect(dispatchSync).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: { name: 'settings' },
    });
  });

  it('creates native stack props that remove routes', () => {
    const dispatch = jest.fn();
    const props = createNativeStackProps({
      dispatch,
      dispatchSync: jest.fn(),
      navigation: {} as NavigationHelpers<ParamListBase>,
      state: { key: 'stack-key', index: 0 } as StackNavigationState<ParamListBase>,
    });

    props.removeRoutes(['settings']);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_ROUTES',
      payload: { routeNames: ['settings'] },
    });
  });

  it('returns each navigator content props type', () => {
    expectTypeOf(createJSStackProps)
      .parameter(0)
      .toEqualTypeOf<
        Pick<
          import('../../standard-navigation/types').StandardNavigatorCreatePropsFactoryDeps<
            StackNavigationState<ParamListBase>
          >,
          'dispatchSync' | 'navigation' | 'state'
        >
      >();
    expectTypeOf(createBaseTabProps).returns.toMatchTypeOf<{
      routeNames: string[];
      preload: (name: string) => void;
    }>();
    expectTypeOf(createJSTabsProps).returns.toMatchTypeOf<{
      popNestedStackToTop: (routeKey: string) => void;
    }>();
    expectTypeOf(createJSTopTabsProps).returns.toMatchTypeOf<{
      navigateToTabSync: (name: string, params: object | undefined) => void;
    }>();
    expectTypeOf(createNativeTabsProps).returns.toMatchTypeOf<{
      navigateSync: (name: string) => void;
    }>();
    expectTypeOf(createNativeStackProps).returns.toMatchTypeOf<{
      removeRoutes: (routeNames: string[]) => void;
    }>();
    expectTypeOf(createJSStackProps).returns.toEqualTypeOf<StackNavigatorCreateProps>();
  });
});
