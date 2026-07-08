import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import {
  type DefaultRouterOptions,
  type NavigationState,
  type ParamListBase,
  type Router,
  StackActions,
  StackRouter,
} from '../../routers';
import { getRouteKey, getStateKey } from '../../routers/getRouteKey';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { type MockActions, MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

// Deterministic structural keys for the root stack (`foo`/`bar`/`baz`/`bax`) and its nested stacks.
const rootKey = getStateKey(undefined);
const fooKey = getRouteKey({ stateKey: rootKey, name: 'foo' });
const barKey = getRouteKey({ stateKey: rootKey, name: 'bar' });
const bazKey = getRouteKey({ stateKey: rootKey, name: 'baz' });
const baxKey = getRouteKey({ stateKey: rootKey, name: 'bax' });
const bazChildKey = getStateKey(bazKey);
const bazQuxKey = getRouteKey({ stateKey: bazChildKey, name: 'qux' });
const bazQuxChildKey = getStateKey(bazQuxKey);
const bazQuxLexKey = getRouteKey({ stateKey: bazQuxChildKey, name: 'lex' });
const baxChildKey = getStateKey(baxKey);
const baxQuxKey = getRouteKey({ stateKey: baxChildKey, name: 'qux' });
const baxQuxChildKey = getStateKey(baxQuxKey);
const baxQuxLexKey = getRouteKey({ stateKey: baxQuxChildKey, name: 'lex' });

jest.mock('nanoid/non-secure', () => {
  const m = { nanoid: () => String(++m.__key), __key: 0 };

  return m;
});

beforeEach(() => {
  MockRouterKey.current = 0;

  require('nanoid/non-secure').__key = 0;
});

test('does not use local bubbling before the root reducer is initialized', () => {
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

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
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

  expect(onStateChange).not.toHaveBeenCalled();
});

test("does not down-bubble actions with navigationInChildEnabled on the root reducer path", () => {
  const CurrentParentRouter = MockRouter;

  function CurrentChildRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ChildRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      shouldActionChangeFocus() {
        return true;
      },

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
    index: 1,
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
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
  const onUnhandledAction = jest.fn();

  const navigation = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer
      ref={navigation}
      onStateChange={onStateChange}
      onUnhandledAction={onUnhandledAction}>
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

  act(() => navigation.navigate('lex'));

  expect(onStateChange).not.toHaveBeenCalled();
  expect(onUnhandledAction).toHaveBeenCalledTimes(1);
  expect(onUnhandledAction).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'NAVIGATE',
      payload: { name: 'lex' },
    })
  );

  expect(navigation.getCurrentRoute()?.name).toBe('foo');

  act(() => navigation.navigateDeprecated('lex'));

  expect(onStateChange).not.toHaveBeenCalled();
  expect(onUnhandledAction).toHaveBeenCalledTimes(2);

  expect(navigation.getCurrentRoute()?.name).toBe('foo');
});

test('does not use target parent bubbling before the root reducer is initialized', () => {
  function CurrentTestRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const TestRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      shouldActionChangeFocus() {
        return true;
      },

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

      shouldActionChangeFocus() {
        return true;
      },

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

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 2,
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

      shouldActionChangeFocus() {
        return true;
      },

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

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
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

test('logs error if no navigator handled the action', () => {
  const TestRouter = MockRouter;

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(TestRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UNKNOWN' });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const initialState = {
    index: 1,
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
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

  const element = (
    <BaseNavigationContainer initialState={initialState}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
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

  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(element).update(element);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining("The action 'UNKNOWN' was not handled by any navigator.")
  );

  spy.mockRestore();
});

test("prevents removing a screen with 'beforeRemove' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = jest.fn();

  let shouldPrevent = true;
  let shouldContinue = false;

  const TestScreen = (props: any) => {
    React.useEffect(
      () =>
        props.navigation.addListener('beforeRemove', (e: any) => {
          onBeforeRemove();

          if (shouldPrevent) {
            e.preventDefault();

            if (shouldContinue) {
              props.navigation.dispatch(e.data.action);
            }
          }
        }),
      [props.navigation]
    );

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => ref.current?.navigate('bar'));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 1,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
    ],
    stale: false,
  });

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 2,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
      {
        key: bazKey,
        name: 'baz',
      },
    ],
    stale: false,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onBeforeRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual({
    index: 2,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
      { key: bazKey, name: 'baz' },
    ],
    stale: false,
  });

  shouldPrevent = false;

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(3);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });

  shouldPrevent = true;
  shouldContinue = true;

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toHaveBeenCalledTimes(5);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });
});

test("prevents removing a child screen with 'beforeRemove' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = jest.fn();

  let shouldPrevent = true;
  let shouldContinue = false;

  const TestScreen = (props: any) => {
    React.useEffect(
      () =>
        props.navigation.addListener('beforeRemove', (e: any) => {
          onBeforeRemove();

          if (shouldPrevent) {
            e.preventDefault();

            if (shouldContinue) {
              props.navigation.dispatch(e.data.action);
            }
          }
        }),
      [props.navigation]
    );

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={TestScreen} />
              <Screen name="lex">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => ref.current?.navigate('bar'));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 1,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
    ],
    stale: false,
  });

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 2,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
      {
        key: bazKey,
        name: 'baz',
        state: {
          index: 0,
          key: bazChildKey,
          routeNames: ['qux', 'lex'],
          routes: [{ key: bazQuxKey, name: 'qux' }],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onBeforeRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual({
    index: 2,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
      {
        key: bazKey,
        name: 'baz',
        state: {
          index: 0,
          key: bazChildKey,
          routeNames: ['qux', 'lex'],
          routes: [{ key: bazQuxKey, name: 'qux' }],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  shouldPrevent = false;

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(3);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });

  shouldPrevent = true;
  shouldContinue = true;

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toHaveBeenCalledTimes(5);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });
});

test("prevents removing a grand child screen with 'beforeRemove' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = jest.fn();

  let shouldPrevent = true;
  let shouldContinue = false;

  const TestScreen = (props: any) => {
    React.useEffect(
      () =>
        props.navigation.addListener('beforeRemove', (e: any) => {
          onBeforeRemove();

          if (shouldPrevent) {
            e.preventDefault();

            if (shouldContinue) {
              props.navigation.dispatch(e.data.action);
            }
          }
        }),
      [props.navigation]
    );

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux">
                {() => (
                  <TestNavigator>
                    <Screen name="lex" component={TestScreen} />
                  </TestNavigator>
                )}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => ref.current?.navigate('bar'));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 1,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
    ],
    stale: false,
  });

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 2,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
      {
        key: bazKey,
        name: 'baz',
        state: {
          index: 0,
          key: bazChildKey,
          routeNames: ['qux'],
          routes: [
            {
              key: bazQuxKey,
              name: 'qux',
              state: {
                index: 0,
                key: bazQuxChildKey,
                routeNames: ['lex'],
                routes: [{ key: bazQuxLexKey, name: 'lex' }],
                stale: false,
              },
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onBeforeRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual({
    index: 2,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
      {
        key: bazKey,
        name: 'baz',
        state: {
          index: 0,
          key: bazChildKey,
          routeNames: ['qux'],
          routes: [
            {
              key: bazQuxKey,
              name: 'qux',
              state: {
                index: 0,
                key: bazQuxChildKey,
                routeNames: ['lex'],
                routes: [{ key: bazQuxLexKey, name: 'lex' }],
                stale: false,
              },
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  shouldPrevent = false;

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(3);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });

  shouldPrevent = true;
  shouldContinue = true;

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.navigate('foo'));

  expect(onStateChange).toHaveBeenCalledTimes(5);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });
});

test("prevents removing by multiple screens with 'beforeRemove' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = {
    bar: jest.fn(),
    baz: jest.fn(),
    lex: jest.fn(),
  };

  const shouldPrevent = {
    bar: true,
    baz: true,
    lex: true,
  };

  const TestScreen = (props: any) => {
    React.useEffect(
      () =>
        props.navigation.addListener('beforeRemove', (e: any) => {
          // @ts-expect-error: we should have the required mocks
          onBeforeRemove[props.route.name]();
          e.preventDefault();

          // @ts-expect-error: we should have the required properties
          if (!shouldPrevent[props.route.name]) {
            props.navigation.dispatch(e.data.action);
          }
        }),
      [props.navigation, props.route.name]
    );

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz" component={TestScreen} />
        <Screen name="bax">
          {() => (
            <TestNavigator>
              <Screen name="qux">
                {() => (
                  <TestNavigator>
                    <Screen name="lex" component={TestScreen} />
                  </TestNavigator>
                )}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => {
    ref.current?.navigate('bar');
    ref.current?.navigate('baz');
    ref.current?.navigate('bax');
  });

  const preventedState = {
    index: 3,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz', 'bax'],
    routes: [
      { key: fooKey, name: 'foo' },
      { key: barKey, name: 'bar' },
      { key: bazKey, name: 'baz' },
      {
        key: baxKey,
        name: 'bax',
        state: {
          index: 0,
          key: baxChildKey,
          routeNames: ['qux'],
          routes: [
            {
              key: baxQuxKey,
              name: 'qux',
              state: {
                index: 0,
                key: baxQuxChildKey,
                routeNames: ['lex'],
                routes: [{ key: baxQuxLexKey, name: 'lex' }],
                stale: false,
              },
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
  };

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith(preventedState);

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onBeforeRemove.lex).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  shouldPrevent.lex = false;

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onBeforeRemove.baz).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  shouldPrevent.baz = false;

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onBeforeRemove.bar).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  shouldPrevent.bar = false;

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz', 'bax'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });
});

test("prevents removing a child screen with 'beforeRemove' event with 'resetRoot'", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = jest.fn();

  let shouldPrevent = true;
  const shouldContinue = false;

  const TestScreen = (props: any) => {
    React.useEffect(
      () =>
        props.navigation.addListener('beforeRemove', (e: any) => {
          onBeforeRemove();

          if (shouldPrevent) {
            e.preventDefault();

            if (shouldContinue) {
              props.navigation.dispatch(e.data.action);
            }
          }
        }),
      [props.navigation]
    );

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={TestScreen} />
              <Screen name="lex">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 1,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      {
        key: bazKey,
        name: 'baz',
        state: {
          index: 0,
          key: bazChildKey,
          routeNames: ['qux', 'lex'],
          routes: [{ key: bazQuxKey, name: 'qux' }],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  act(() =>
    ref.current?.resetRoot({
      index: 0,
      key: rootKey,
      routeNames: ['foo', 'bar', 'baz'],
      routes: [{ key: fooKey, name: 'foo' }],
      stale: false,
    })
  );

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onBeforeRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual({
    index: 1,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: fooKey, name: 'foo' },
      {
        key: bazKey,
        name: 'baz',
        state: {
          index: 0,
          key: bazChildKey,
          routeNames: ['qux', 'lex'],
          routes: [{ key: bazQuxKey, name: 'qux' }],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  shouldPrevent = false;

  act(() =>
    ref.current?.resetRoot({
      index: 0,
      key: rootKey,
      routeNames: ['foo', 'bar', 'baz'],
      routes: [{ key: fooKey, name: 'foo' }],
      stale: false,
    })
  );

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });
});
