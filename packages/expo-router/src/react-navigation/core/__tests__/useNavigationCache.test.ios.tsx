import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import {
  CommonActions,
  type NavigationState,
  type ParamListBase,
  StackRouter,
} from '../../routers';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useEventEmitter } from '../useEventEmitter';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { useNavigationCache } from '../useNavigationCache';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('preserves reference for navigation objects', () => {
  expect.assertions(2);

  const state: NavigationState = {
    type: 'tab',
    stale: false as const,
    index: 1,
    key: 'State',
    routeNames: ['Foo', 'Bar'],
    routes: [
      { key: 'Foo', name: 'Foo' },
      { key: 'Bar', name: 'Bar' },
    ],
  };

  const getState = () => state;
  const navigation = {} as any;
  const setOptions = (() => {}) as any;
  const router = MockRouter({});

  const Test = () => {
    const previous = React.useRef<any>(undefined);

    const emitter = useEventEmitter();
    const getNavigation = useNavigationCache({
      routes: state.routes,
      routeNames: state.routeNames,
      getState,
      navigation,
      setOptions,
      router,
      emitter,
    });

    const navigations = state.routes.map((route) => getNavigation(route));
    if (previous.current !== undefined) {
      navigations.forEach((navigation, index) => {
        expect(navigation).toBe(previous.current[index]);
      });
    }

    React.useEffect(() => {
      previous.current = navigations;
    });

    return null;
  };

  const root = render(<Test />);

  root.update(<Test />);
});

test('preserves placeholder navigation after the route is created', () => {
  let routeNames = ['Foo', 'Bar'];
  let routes = [{ key: 'Foo-key', name: 'Foo' }];
  const getState = (): NavigationState => ({
    type: 'tab',
    stale: false as const,
    index: 0,
    key: 'State',
    routeNames,
    routes,
  });
  const navigation = {
    getId: () => 'State',
    getParent: jest.fn(),
  } as any;
  const setOptions = (() => {}) as any;
  const router = MockRouter({});
  let getNavigation: ReturnType<typeof useNavigationCache>;

  const Test = () => {
    const emitter = useEventEmitter();
    getNavigation = useNavigationCache({
      routes,
      routeNames,
      getState,
      navigation,
      setOptions,
      router,
      emitter,
    });
    return null;
  };

  const root = render(<Test />);
  const placeholderNavigation = getNavigation!({ key: 'Bar', name: 'Bar' });

  routes = [...routes, { key: 'Bar-key', name: 'Bar' }];
  root.update(<Test />);

  expect(getNavigation!({ key: 'Bar', name: 'Bar' })).toBe(placeholderNavigation);

  routeNames = ['Foo'];
  routes = routes.filter((route) => route.name !== 'Bar');
  root.update(<Test />);

  expect(placeholderNavigation.getParent('State')).toBe(placeholderNavigation);
});

test('returns correct value for isFocused', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  let navigation: any;

  const Test = (props: any) => {
    navigation = props.navigation;

    return null;
  };

  render(
    <BaseNavigationContainer
      initialState={{
        index: 0,
        routes: [{ name: 'first' }, { name: 'second' }, { name: 'third' }],
      }}>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second" component={Test} />
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(false);

  act(() => navigation.navigate('second'));

  expect(navigation.isFocused()).toBe(true);

  act(() => navigation.navigate('third'));

  expect(navigation.isFocused()).toBe(false);

  act(() => navigation.navigate('second'));

  expect(navigation.isFocused()).toBe(true);
});

test('returns correct value for isFocused after changing screens', () => {
  const TestRouter = (options: Parameters<typeof MockRouter>[0]): ReturnType<typeof MockRouter> => {
    const router = MockRouter(options);

    return {
      ...router,

      getStateForAction(state, action, options) {
        if (action.type !== 'ROUTE_NAMES_CHANGED') {
          return router.getStateForAction(state, action, options);
        }

        const { routeNames } = action.payload;
        const routes = routeNames.map(
          (name) =>
            state.routes.find((r) => r.name === name) || {
              name,
              key: name,
            }
        );

        return {
          state: {
            ...state,
            routeNames,
            routes,
            index: routes.length - 1,
          },
          affectedRouteKey: routes[routes.length - 1]?.key,
        };
      },
    };
  };

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(TestRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  let navigation: any;

  const Test = (props: any) => {
    navigation = props.navigation;

    return null;
  };

  const root = render(
    <BaseNavigationContainer
      initialState={{
        index: 0,
        routes: [{ name: 'first' }, { name: 'second' }, { name: 'third' }],
      }}>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second" component={Test} />
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(false);

  root.update(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
        <Screen name="second" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(true);

  root.update(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
        <Screen name="fourth">{() => null}</Screen>
        <Screen name="second" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(true);

  root.update(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
        <Screen name="second" component={Test} />
        <Screen name="fourth">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.isFocused()).toBe(false);
});

test('ignores dispatches from a preloaded stack screen until it is promoted', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  let navigation: any;
  const TestScreen = (props: any) => {
    navigation = props.navigation;
    return null;
  };
  const ref = createNavigationContainerRef<ParamListBase>();
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => ref.current?.dispatch(CommonActions.preload('second')));
  const preloadedNavigation = navigation;
  const preloadedState = ref.current?.getRootState();

  act(() => preloadedNavigation.goBack());

  expect(warn).toHaveBeenCalledWith(
    "Ignored a navigation action dispatched from the preloaded screen 'second'. The screen is rendered for preloading and is not focused, so its actions would unexpectedly modify the visible stack. Wait until the screen is focused before dispatching."
  );
  expect(ref.current?.getRootState()).toEqual(preloadedState);

  act(() => ref.current?.navigate('second'));

  expect(navigation).toBe(preloadedNavigation);
  act(() => preloadedNavigation.goBack());
  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['first']);
});
