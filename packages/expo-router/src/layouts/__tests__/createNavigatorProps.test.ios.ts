import { expectTypeOf } from 'expect-type';

import { createBaseTabProps, createNativeStackProps } from '../../exports';
import { createNativeTabsProps } from '../../native-tabs';
import type { NavigationHelpers, ParamListBase } from '../../react-navigation/native';
import type { StackNavigationState, TabNavigationState } from '../../react-navigation/routers';
import type { StackNavigatorCreateProps } from '../../react-navigation/stack/navigators/createStackNavigator';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../../standard-navigation/types';
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

  const isPreloaded = jest.fn();
  const tabDeps = {
    dispatch: jest.fn(),
    dispatchSync: jest.fn(),
    isPreloaded,
    isRemovalPrevented: jest.fn(),
    navigation: {} as NavigationHelpers<ParamListBase>,
    state: tabState,
  } satisfies StandardNavigatorCreatePropsFactoryDeps<TabNavigationState<ParamListBase>>;

  it('creates shared tab route names and preload props', () => {
    const dispatch = jest.fn();
    const props = createBaseTabProps({ ...tabDeps, dispatch });

    props.preload('settings');

    expect(props.routeNames).toBe(tabState.routeNames);
    expect(props.isPreloaded).toBe(isPreloaded);
    expect(dispatch).toHaveBeenCalledWith({ type: 'PRELOAD', payload: { name: 'settings' } });
  });

  it('creates JS tabs props that pop a nested stack', () => {
    const dispatch = jest.fn();
    const props = createJSTabsProps({ ...tabDeps, dispatch });

    props.popNestedStackToTop('settings-key');

    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'POP_TO_TOP',
      target: 'settings-stack-key',
    });
  });

  it('does not pop a missing nested stack', () => {
    const dispatch = jest.fn();
    const props = createJSTabsProps({ ...tabDeps, dispatch });

    props.popNestedStackToTop('index-key');

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('creates synchronous top tabs navigation props', () => {
    const dispatchSync = jest.fn();
    const props = createJSTopTabsProps({
      ...tabDeps,
      dispatch: jest.fn(),
      dispatchSync,
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
      ...tabDeps,
      dispatch: jest.fn(),
      dispatchSync,
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
      isPreloaded,
      isRemovalPrevented: jest.fn(),
      navigation: {} as NavigationHelpers<ParamListBase>,
      state: { key: 'stack-key', index: 0 } as StackNavigationState<ParamListBase>,
    });

    props.removeRoutes(['settings']);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_ROUTES',
      payload: { routeNames: ['settings'] },
    });
    expect(props.isPreloaded).toBe(isPreloaded);
  });

  it('returns each navigator content props type', () => {
    type StackDeps = StandardNavigatorCreatePropsFactoryDeps<
      StackNavigationState<ParamListBase>
    >;
    type TabDeps = StandardNavigatorCreatePropsFactoryDeps<TabNavigationState<ParamListBase>>;

    expectTypeOf(createJSStackProps).parameter(0).toEqualTypeOf<StackDeps>();
    expectTypeOf(createNativeStackProps).parameter(0).toEqualTypeOf<StackDeps>();
    expectTypeOf(createBaseTabProps).parameter(0).toEqualTypeOf<TabDeps>();
    expectTypeOf(createJSTabsProps).parameter(0).toEqualTypeOf<TabDeps>();
    expectTypeOf(createJSTopTabsProps).parameter(0).toEqualTypeOf<TabDeps>();
    expectTypeOf(createNativeTabsProps).parameter(0).toEqualTypeOf<TabDeps>();
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
