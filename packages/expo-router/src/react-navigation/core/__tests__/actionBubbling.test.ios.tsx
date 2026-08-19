import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import {
  type DefaultRouterOptions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type Router,
  StackActions,
  StackRouter,
} from '../../routers';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { usePreventRemove } from '../usePreventRemove';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { type MockActions, MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

jest.mock('nanoid/non-secure', () => {
  const m = { nanoid: () => String(++m.__key), __key: 0 };

  return m;
});

beforeEach(() => {
  MockRouterKey.current = 0;

  require('nanoid/non-secure').__key = 0;
});

test("lets parent handle the action if child didn't", () => {
  function CurrentRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const ParentRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          const routes = state.routes.slice().reverse();
          return {
            state: { ...state, routes },
            affectedRouteKey: routes[state.index]?.key,
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

  let dispatch: (action: { type: 'REVERSE' }) => void;
  const TestScreen = (props: any) => {
    dispatch = props.navigation.dispatchSync;
    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer
      initialState={{
        type: 'test',
        index: 2,
        routes: [
          { name: 'foo' },
          { name: 'bar' },
          {
            name: 'baz',
            state: {
              type: 'test',
              index: 0,
              routes: [{ name: 'qux' }],
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

  onStateChange.mockClear();

  act(() => dispatch({ type: 'REVERSE' }));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange.mock.calls[0]![0]).toMatchObject({
    routes: [
      {
        name: 'baz',
      },
      { name: 'bar' },
      { name: 'foo' },
    ],
  });
});

test('handles an unsupported targeted action as a no-op without bubbling', () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  const onUnhandledAction = jest.fn();

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  render(
    <BaseNavigationContainer ref={ref} onUnhandledAction={onUnhandledAction}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const state = ref.current!.getRootState();

  act(() => ref.dispatchSync({ type: 'POP_TO_TOP', target: state.key }));

  expect(ref.current!.getRootState()).toBe(state);
  expect(onUnhandledAction).not.toHaveBeenCalled();
});

test("doesn't let a child handle an untargeted navigate action", () => {
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
      initialState={{
        routes: [
          { name: 'foo' },
          { name: 'bar' },
          { name: 'baz', state: { routes: [{ name: 'qux' }, { name: 'lex' }] } },
        ],
      }}
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
});

test('action goes to correct parent navigator if target is specified', () => {
  function CurrentTestRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const TestRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
      ...CurrentMockRouter,

      shouldActionChangeFocus() {
        return true;
      },

      getStateForAction(state, action, options) {
        if (action.type === 'REVERSE') {
          const routes = state.routes.slice().reverse();
          return {
            state: { ...state, routes },
            affectedRouteKey: routes[state.index]?.key,
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

  let dispatch: (action: { type: 'REVERSE'; target: string }) => void;
  const TestScreen = (props: any) => {
    dispatch = props.navigation.dispatch;
    return null;
  };

  const initialState = {
    type: 'test',
    index: 1,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          type: 'test',
          index: 0,
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
  act(() => dispatch({ type: 'REVERSE', target: '0' }));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    routeKeySeq: 0,
    type: 'test',
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
          stale: false,
          routeKeySeq: 0,
          type: 'test',
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
          const routes = state.routes.slice().reverse();
          return {
            state: { ...state, routes },
            affectedRouteKey: routes[state.index]?.key,
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
    type: 'test',
    index: 0,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
      {
        key: 'baz',
        name: 'baz',
        state: {
          type: 'test',
          index: 0,
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
    ref.dispatchSync({ type: 'REVERSE', target: '1' });
  });

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    routeKeySeq: 0,
    type: 'test',
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
          routeKeySeq: 0,
          type: 'test',
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
          const routes = state.routes.slice().reverse();
          return {
            state: { ...state, routes },
            affectedRouteKey: routes[state.index]?.key,
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

  let dispatch: (action: { type: 'UNKNOWN' }) => void;
  const TestScreen = (props: any) => {
    dispatch = props.navigation.dispatch;
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
  act(() => dispatch({ type: 'UNKNOWN' }));

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining("The action 'UNKNOWN' was not handled by any navigator.")
  );

  spy.mockRestore();
});

test("prevents removing a screen with 'removePrevented' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = jest.fn();

  let setPreventRemove: React.Dispatch<React.SetStateAction<boolean>>;

  const TestScreen = () => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    const [blockedAction, setBlockedAction] = React.useState<NavigationAction>();
    setPreventRemove = setPreventRemoveState;
    usePreventRemove(preventRemove, ({ data }) => {
      onBeforeRemove();
      setBlockedAction(data.action);
    });
    React.useEffect(() => {
      if (!preventRemove && blockedAction) {
        ref.current?.dispatchSync(blockedAction);
      }
    }, [blockedAction, preventRemove]);

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
    type: 'stack',
    index: 1,
    key: 'navigator-3',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-2', name: 'foo' },
      { key: 'bar:3-0', name: 'bar' },
    ],
    stale: false,
    routeKeySeq: 1,
  });

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenCalledWith({
    type: 'stack',
    index: 2,
    key: 'navigator-3',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-2', name: 'foo' },
      { key: 'bar:3-0', name: 'bar' },
      {
        key: 'baz:3-1',
        name: 'baz',
        params: undefined,
        path: undefined,
      },
    ],
    stale: false,
    routeKeySeq: 2,
  });

  act(() => ref.current?.dispatchSync(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onBeforeRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual({
    type: 'stack',
    index: 2,
    key: 'navigator-3',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-2', name: 'foo' },
      { key: 'bar:3-0', name: 'bar' },
      { key: 'baz:3-1', name: 'baz' },
    ],
    stale: false,
    routeKeySeq: 2,
  });

  act(() => {
    setPreventRemove(false);
  });

  expect(onStateChange).toHaveBeenCalledTimes(3);
  expect(onStateChange).toHaveBeenCalledWith({
    type: 'stack',
    index: 0,
    key: 'navigator-3',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-2', name: 'foo' }],
    stale: false,
    routeKeySeq: 2,
  });
});

test("prevents removing a child screen with 'removePrevented' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = jest.fn();

  const TestScreen = () => {
    const [preventRemove] = React.useState(true);
    const [blockedAction, setBlockedAction] = React.useState<NavigationAction>();
    usePreventRemove(preventRemove, ({ data }) => {
      onBeforeRemove();
      setBlockedAction(data.action);
    });
    React.useEffect(() => {
      if (!preventRemove && blockedAction) {
        ref.current?.dispatchSync(blockedAction);
      }
    }, [blockedAction, preventRemove]);

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        type: 'stack',
        index: 0,
        routes: [
          { name: 'foo' },
          { name: 'bar' },
          {
            name: 'baz',
            state: {
              type: 'stack',
              routeNames: ['qux', 'lex'],
              routes: [{ name: 'qux' }],
            },
          },
        ],
      }}
      onStateChange={onStateChange}>
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
  onStateChange.mockClear();

  act(() => ref.current?.navigate('bar'));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenLastCalledWith(ref.current!.getRootState());

  act(() => ref.current?.navigate('baz'));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  const preventedState = ref.current!.getRootState();
  expect(onStateChange).toHaveBeenLastCalledWith(preventedState);

  act(() => ref.current?.dispatchSync(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onBeforeRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);
});

test("prevents removing a grand child screen with 'removePrevented' event", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = jest.fn();

  const TestScreen = () => {
    const [preventRemove] = React.useState(true);
    const [blockedAction, setBlockedAction] = React.useState<NavigationAction>();
    usePreventRemove(preventRemove, ({ data }) => {
      onBeforeRemove();
      setBlockedAction(data.action);
    });
    React.useEffect(() => {
      if (!preventRemove && blockedAction) {
        ref.current?.dispatchSync(blockedAction);
      }
    }, [blockedAction, preventRemove]);

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        type: 'stack',
        index: 0,
        routes: [
          { name: 'foo' },
          { name: 'bar' },
          {
            name: 'baz',
            state: {
              type: 'stack',
              routes: [{ name: 'qux', state: { type: 'stack', routes: [{ name: 'lex' }] } }],
            },
          },
        ],
      }}
      onStateChange={onStateChange}>
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
  onStateChange.mockClear();

  act(() => ref.current?.navigate('bar'));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenLastCalledWith(ref.current!.getRootState());

  act(() => ref.current?.navigate('baz'));
  const preventedState = ref.current!.getRootState();

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenLastCalledWith(preventedState);

  act(() => ref.current?.dispatchSync(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onBeforeRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);
});

test("prevents removing by multiple screens with 'removePrevented' event", () => {
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

  const setPreventRemove: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {};

  const TestScreen = (props: any) => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    const [blockedAction, setBlockedAction] = React.useState<NavigationAction>();
    setPreventRemove[props.route.name] = setPreventRemoveState;
    usePreventRemove(preventRemove, ({ data }) => {
      // @ts-expect-error: we should have the required mocks
      onBeforeRemove[props.route.name]();
      setBlockedAction(data.action);
    });
    React.useEffect(() => {
      if (!preventRemove && blockedAction) {
        ref.current?.dispatchSync(blockedAction);
      }
    }, [blockedAction, preventRemove]);

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        type: 'stack',
        index: 0,
        routes: [
          { name: 'foo' },
          { name: 'bar' },
          { name: 'baz' },
          {
            name: 'bax',
            state: {
              type: 'stack',
              routes: [{ name: 'qux', state: { type: 'stack', routes: [{ name: 'lex' }] } }],
            },
          },
        ],
      }}
      onStateChange={onStateChange}>
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

  const preventedState = ref.current!.getRootState();

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith(preventedState);

  act(() => ref.current?.dispatchSync(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onBeforeRemove.lex).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => {
    setPreventRemove.lex!(false);
  });

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onBeforeRemove.baz).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => {
    setPreventRemove.baz!(false);
  });

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onBeforeRemove.bar).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);
});

test("prevents removing a child screen with 'removePrevented' event with 'resetRoot'", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onBeforeRemove = jest.fn();

  const TestScreen = () => {
    const [preventRemove] = React.useState(true);
    usePreventRemove(preventRemove, onBeforeRemove);

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        type: 'stack',
        index: 0,
        routes: [
          { name: 'foo' },
          {
            name: 'baz',
            state: {
              type: 'stack',
              routeNames: ['qux', 'lex'],
              routes: [{ name: 'qux' }],
            },
          },
        ],
      }}
      onStateChange={onStateChange}>
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
  onStateChange.mockClear();

  act(() => ref.current?.navigate('baz'));
  const preventedState = ref.current!.getRootState();

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenLastCalledWith(preventedState);

  act(() =>
    ref.current?.resetRoot({
      index: 0,
      key: preventedState.key,
      routeNames: preventedState.routeNames,
      routes: [preventedState.routes[0]!],
      stale: false,
      routeKeySeq: 0,
    })
  );

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onBeforeRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);
});
