import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import {
  type DefaultRouterOptions,
  type NavigationState,
  type ParamListBase,
  type Router,
} from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { type MockActions, MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

jest.mock('nanoid/non-secure', () => {
  const m = { nanoid: () => String(++m.__key), __key: 0 };

  return m;
});

beforeEach(() => {
  MockRouterKey.current = 0;

  require('nanoid/non-secure').__key = 0;
});

test('bubbles an untargeted child action up to the handling ancestor via the root reducer', () => {
  function CurrentRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ParentRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ParentRouter;
  }
  const ParentNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(CurrentRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const ChildNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  MockRouterKey.current = 2;

  render(
    <BaseNavigationContainer
      initialState={{
        stale: false as const,
        key: '0',
        index: 2,
        routeNames: ['foo', 'bar', 'baz'],
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar' },
          {
            key: 'baz',
            name: 'baz',
            state: {
              stale: false as const,
              key: '1',
              index: 0,
              routeNames: ['qux'],
              routes: [{ key: 'qux', name: 'qux' }],
            },
          },
        ],
      }}
      onStateChange={onStateChange}>
      <ParentNavigator initialRouteName="baz">
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux" component={TestScreen} />
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  // `REVERSE` is dispatched from the deeply-nested `qux`. Its own (child) router doesn't handle it,
  // so the root reducer ascends and applies it at the parent navigator that does — no local
  // per-navigator bubbling, but the untargeted action still reaches the handling ancestor.
  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange.mock.calls[0]![0].routes.map((route: any) => route.name)).toEqual([
    'baz',
    'bar',
    'foo',
  ]);
});

test("does not down-bubble actions with navigationInChildEnabled on the root reducer path", () => {
  const CurrentParentRouter = MockRouter;

  function CurrentChildRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }
        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const ChildNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      CurrentChildRouter,
      props
    );

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const ParentNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      CurrentParentRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const initialState = {
    stale: false as const,
    index: 1,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false as const,
          index: 0,
          key: '4',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'qux', name: 'qux' },
            { key: 'lex', name: 'lex' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  };

  MockRouterKey.current = 5;

  const element = (
    <BaseNavigationContainer
      navigationInChildEnabled
      initialState={initialState}
      onStateChange={onStateChange}>
      <ParentNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).not.toHaveBeenCalled();
});

test("does not down-bubble NAVIGATE_DEPRECATED on the root reducer path", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = () => null;

  const onStateChange = jest.fn();

  const navigation = createNavigationContainerRef<ParamListBase>();

  MockRouterKey.current = 2;

  const element = (
    <BaseNavigationContainer
      ref={navigation}
      initialState={{
        stale: false as const,
        index: 0,
        key: '0',
        routeNames: ['foo', 'bar', 'baz'],
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar' },
          {
            key: 'baz',
            name: 'baz',
            state: {
              stale: false as const,
              index: 0,
              key: '1',
              routeNames: ['qux', 'lex'],
              routes: [
                { key: 'qux', name: 'qux' },
                { key: 'lex', name: 'lex' },
              ],
            },
          },
        ],
      }}
      onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={TestScreen} />
              <Screen name="lex" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  // `lex` is only a route of the nested `baz` navigator, which isn't focused. An untargeted
  // NAVIGATE/NAVIGATE_DEPRECATED must not down-bubble into it, so the action goes unhandled: no
  // state change and focus stays on `foo`.
  act(() => navigation.navigate('lex'));

  expect(onStateChange).not.toHaveBeenCalled();
  expect(navigation.getCurrentRoute()?.name).toBe('foo');

  act(() => navigation.navigateDeprecated('lex'));

  expect(onStateChange).not.toHaveBeenCalled();
  expect(navigation.getCurrentRoute()?.name).toBe('foo');
});

test('does not use target parent bubbling before the root reducer is initialized', () => {
  function CurrentTestRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const TestRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return TestRouter;
  }

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      CurrentTestRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE', target: '0' });
    }, [props.navigation]);

    return null;
  };

  const initialState = {
    stale: false,
    index: 1,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          index: 0,
          key: '1',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'lex', name: 'lex' },
            { key: 'qux', name: 'qux' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
      { key: 'foo', name: 'foo' },
    ],
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer initialState={initialState} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).not.toHaveBeenCalled();
});

test('action goes to correct child navigator if target is specified', () => {
  function CurrentTestRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const TestRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return TestRouter;
  }

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      CurrentTestRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const initialState = {
    stale: false,
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          index: 0,
          key: '1',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'qux', name: 'qux' },
            { key: 'lex', name: 'lex' },
          ],
        },
      },
    ],
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer ref={ref} initialState={initialState} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  act(() => {
    ref.dispatch({ type: 'REVERSE', target: '1' });
  });

  // A custom (non-NAVIGATE) action reaches the targeted child and reverses it, but does not bubble
  // focus to the root — focus-change is now the fixed NAVIGATE-type rule, not a per-router hook, so
  // the root index stays put.
  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 0,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          index: 0,
          key: '1',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'lex', name: 'lex' },
            { key: 'qux', name: 'qux' },
          ],
        },
      },
    ],
  });
});

test("action doesn't bubble if target is specified", () => {
  const CurrentParentRouter = MockRouter;

  function CurrentChildRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          return {
            ...state,
            routes: state.routes.slice().reverse(),
          };
        }

        return CurrentMockRouter.getStateForAction(state, action, options);
      },
    };
    return ChildRouter;
  }

  const ChildNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      CurrentChildRouter,
      props
    );

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const ParentNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      CurrentParentRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'REVERSE', target: '0' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const initialState = {
    stale: false as const,
    index: 1,
    key: '0',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false as const,
          index: 0,
          key: '1',
          routeNames: ['qux', 'lex'],
          routes: [
            { key: 'qux', name: 'qux' },
            { key: 'lex', name: 'lex' },
          ],
        },
      },
    ],
  };

  MockRouterKey.current = 2;

  const element = (
    <BaseNavigationContainer initialState={initialState} onStateChange={onStateChange}>
      <ParentNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">
          {() => (
            <ChildNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </ChildNavigator>
          )}
        </Screen>
      </ParentNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).not.toHaveBeenCalled();
});

test('an unhandled action is a silent no-op (no throw, no console error)', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  // Dispatches an action no navigator can reduce once mounted. With the unhandled-action reporting
  // removed, it neither throws nor logs — it just falls through as a no-op.
  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UNKNOWN' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  MockRouterKey.current = 5;

  const element = (
    <BaseNavigationContainer
      ref={navigation}
      initialState={{
        stale: false as const,
        index: 0,
        key: '0',
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar' },
        ],
      }}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  expect(() => render(element).update(element)).not.toThrow();

  expect(spy).not.toHaveBeenCalled();
  expect(navigation.getCurrentRoute()?.name).toBe('foo');

  spy.mockRestore();
});
