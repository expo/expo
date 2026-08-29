import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { RouterRegistryProvider } from '../../../global-state/routerRegistry';
import { RoutingQueueProvider } from '../../../global-state/routingQueueContext';
import {
  CommonActions,
  type DefaultRouterOptions,
  type NavigationState,
  type ParamListBase,
  type Router,
  StackRouter,
  TabRouter,
} from '../../routers';
import { BaseNavigationContainer as RawBaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import type { EventListenerCallback, NavigationContainerEventMap } from '../types';
import { useNavigationBuilder } from '../useNavigationBuilder';
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

test('throws when nesting containers', () => {
  expect(() =>
    render(
      <BaseNavigationContainer>
        <BaseNavigationContainer>
          <></>
        </BaseNavigationContainer>
      </BaseNavigationContainer>
    )
  ).toThrow("install '@react-navigation/native' and use its NavigationContainer instead.");
});

test('rejects a partial initial state', () => {
  const initialState = { routes: [{ name: 'home' }] };

  expect(() =>
    render(
      <RawBaseNavigationContainer initialState={initialState}>{null}</RawBaseNavigationContainer>
    )
  ).toThrow('The navigation container received an incomplete initial state.');
});

test('rejects a partial nested initial state', () => {
  const initialState = {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['home'],
    routes: [
      {
        key: 'home',
        name: 'home',
        state: {
          routes: [{ name: 'details' }],
        },
      },
    ],
  };

  expect(() =>
    render(
      <RawBaseNavigationContainer initialState={initialState}>{null}</RawBaseNavigationContainer>
    )
  ).toThrow('The navigation container received an incomplete initial state.');
});

test('rejects an initial state without an index', () => {
  const initialState = {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    routeNames: ['home'],
    routes: [{ key: 'home', name: 'home' }],
  };

  expect(() =>
    render(
      <RawBaseNavigationContainer initialState={initialState}>{null}</RawBaseNavigationContainer>
    )
  ).toThrow('The navigation container received an incomplete initial state.');
});

test('rejects an initial state without route keys', () => {
  const initialState = {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['home'],
    routes: [{ name: 'home' }],
  };

  expect(() =>
    render(
      <RawBaseNavigationContainer initialState={initialState}>{null}</RawBaseNavigationContainer>
    )
  ).toThrow('The navigation container received an incomplete initial state.');
});

test('preserves a complete initial state by identity', () => {
  const initialState: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['home'],
    routes: [{ key: 'home', name: 'home' }],
  };
  const ref = createNavigationContainerRef<ParamListBase>();

  function Stack(props: any) {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  }

  render(
    <RoutingQueueProvider>
      <RouterRegistryProvider>
        <RawBaseNavigationContainer ref={ref} initialState={initialState}>
          <Stack>
            <Screen name="home">{() => null}</Screen>
          </Stack>
        </RawBaseNavigationContainer>
      </RouterRegistryProvider>
    </RoutingQueueProvider>
  );

  expect(ref.current?.getRootState()).toBe(initialState);
});

test('handle dispatching with ref', () => {
  function CurrentRootRouter(options: DefaultRouterOptions) {
    const CurrentMockRouter = MockRouter(options);
    const RootRouter: Router<NavigationState, MockActions | { type: 'REVERSE' }> = {
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
    return RootRouter;
  }

  const RootNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      CurrentRootRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const onStateChange = jest.fn();

  const initialState = {
    stale: false as const,
    routeKeySeq: 0,
    type: 'test',
    key: '0',
    index: 1,
    routeNames: ['foo', 'foo2', 'bar', 'baz'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
  };

  const element = (
    <RoutingQueueProvider>
      <RouterRegistryProvider>
        <RawBaseNavigationContainer
          ref={ref}
          initialState={initialState}
          onStateChange={onStateChange}>
          <RootNavigator>
            <Screen name="foo">{() => null}</Screen>
            <Screen name="foo2">{() => null}</Screen>
            <Screen name="bar">{() => null}</Screen>
            <Screen name="baz">{() => null}</Screen>
          </RootNavigator>
        </RawBaseNavigationContainer>
      </RouterRegistryProvider>
    </RoutingQueueProvider>
  );

  render(element).update(element);

  act(() => {
    ref.current?.dispatch({ type: 'REVERSE' });
  });

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenLastCalledWith({
    stale: false,
    routeKeySeq: 0,
    type: 'test',
    index: 1,
    key: '0',
    routeNames: ['foo', 'foo2', 'bar', 'baz'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
    ],
  });

  act(() => {
    ref.current?.dispatchSync({ type: 'REVERSE' });
  });

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['baz', 'bar']);
});

test('handles resetting to a complete state with ref', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="foo2">
          {() => (
            <TestNavigator>
              <Screen name="qux1">{() => null}</Screen>
              <Screen name="lex1">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux2">{() => null}</Screen>
              <Screen name="lex2">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  const state = {
    stale: false as const,
    routeKeySeq: 0,
    type: 'test',
    key: 'navigator-3',
    index: 1,
    routeNames: ['foo', 'foo2', 'bar', 'baz'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false as const,
          routeKeySeq: 0,
          type: 'test',
          index: 0,
          key: '4',
          routeNames: ['qux2', 'lex2'],
          routes: [
            { key: 'qux2', name: 'qux2' },
            { key: 'lex2', name: 'lex2' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  };

  act(() => {
    ref.current?.dispatch({ ...CommonActions.reset(state), target: state.key });
  });

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenLastCalledWith({
    stale: false,
    routeKeySeq: 0,
    type: 'test',
    index: 1,
    key: 'navigator-3',
    routeNames: ['foo', 'foo2', 'bar', 'baz'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        state: {
          stale: false,
          routeKeySeq: 0,
          type: 'test',
          index: 0,
          key: '4',
          routeNames: ['qux2', 'lex2'],
          routes: [
            { key: 'qux2', name: 'qux2' },
            { key: 'lex2', name: 'lex2' },
          ],
        },
      },
      { key: 'bar', name: 'bar' },
    ],
  });
});

test('handles getRootState', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer ref={ref}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="qux">{() => null}</Screen>
              <Screen name="lex">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
        <Screen name="bar">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  let state;
  if (ref.current) {
    state = ref.current.getRootState();
  }
  expect(state).toEqual({
    index: 0,
    key: 'navigator-3',
    routeNames: ['foo', 'bar'],
    routes: [
      {
        key: 'foo-2',
        name: 'foo',
        state: {
          index: 0,
          key: 'navigator-7',
          routeNames: ['qux', 'lex'],
          routes: [{ key: 'qux-6', name: 'qux' }],
          stale: false,
          routeKeySeq: 0,
        },
      },
    ],
    stale: false,
    routeKeySeq: 0,
  });
});

test('emits ready event when the container is ready with synchronous content', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const listener = jest.fn();

  ref.addListener('ready', () => {
    listener(ref.isReady(), ref.getCurrentRoute()?.name);
  });

  expect(listener).not.toHaveBeenCalled();

  render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(true, 'foo');
});

// TODO(@ubax): restore when actions dispatched before registration are deferred.
// https://linear.app/expo/issue/ENG-26123/fix-event-emission-from-global-store
test.skip('emits ready event when the container is ready with asynchronous content', async () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const listener = jest.fn();

  ref.addListener('ready', () => {
    listener(ref.isReady(), ref.getCurrentRoute()?.name);
  });

  const wrapper = render(<BaseNavigationContainer ref={ref}>{null}</BaseNavigationContainer>);

  expect(listener).not.toHaveBeenCalled();

  await Promise.resolve();

  wrapper.update(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(true, 'foo');
});

test('emits state events when the state changes', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar">{() => null}</Screen>
        <Screen name="baz">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  type ListenerType = EventListenerCallback<NavigationContainerEventMap, 'state'>;
  const listener = jest.fn<ReturnType<ListenerType>, Parameters<ListenerType>>();

  ref.current?.addListener('state', listener);

  expect(listener).not.toHaveBeenCalled();

  act(() => {
    ref.current?.dispatchSync(CommonActions.navigate('bar'));
  });

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.calls[0]![0].data.state).toEqual({
    stale: false,
    routeKeySeq: 0,
    type: 'test',
    index: 1,
    key: 'navigator-3',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-2', name: 'foo' },
      { key: 'bar-0', name: 'bar', params: undefined },
    ],
  });

  act(() => {
    ref.current?.navigate('baz', { answer: 42 });
  });

  expect(listener).toHaveBeenCalledTimes(2);
  expect(listener.mock.calls[1]![0].data.state).toEqual({
    stale: false,
    routeKeySeq: 0,
    type: 'test',
    index: 2,
    key: 'navigator-3',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      { key: 'foo-2', name: 'foo' },
      { key: 'bar-0', name: 'bar', params: undefined },
      { key: 'baz-1', name: 'baz', params: { answer: 42 } },
    ],
  });
});

test('does not emit state events when a new navigator mounts with complete state', () => {
  jest.useFakeTimers();

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const NestedNavigator = () => {
    const [isRendered, setIsRendered] = React.useState(false);

    React.useEffect(() => {
      setTimeout(() => setIsRendered(true), 100);
    }, []);

    if (!isRendered) {
      return null;
    }

    return (
      <TestNavigator>
        <Screen name="baz">{() => null}</Screen>
        <Screen name="bax">{() => null}</Screen>
      </TestNavigator>
    );
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      initialState={
        // The nested state is complete, but the prop's partial-state union rejects route keys.
        {
          stale: false,
          routeKeySeq: 0,
          type: 'test',
          key: '2',
          index: 0,
          routeNames: ['foo', 'bar'],
          routes: [
            { key: 'foo-0', name: 'foo' },
            {
              key: 'bar-1',
              name: 'bar',
              state: {
                stale: false,
                routeKeySeq: 0,
                type: 'test',
                key: '1',
                index: 0,
                routeNames: ['baz', 'bax'],
                routes: [{ key: 'baz-0', name: 'baz' }],
              },
            },
          ],
        } as NavigationState
      }
      onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={NestedNavigator} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  type ListenerType = EventListenerCallback<NavigationContainerEventMap, 'state'>;
  const listener = jest.fn<ReturnType<ListenerType>, Parameters<ListenerType>>();

  ref.current?.addListener('state', listener);

  expect(listener).not.toHaveBeenCalled();
  expect(onStateChange).not.toHaveBeenCalled();

  act(() => {
    jest.runAllTimers();
  });

  expect(listener).not.toHaveBeenCalled();
  expect(onStateChange).not.toHaveBeenCalled();
});

test('emits option events when options change with tab router', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        type: 'tab',
        routes: [
          { name: 'foo' },
          { name: 'bar' },
          { name: 'baz', state: { type: 'tab', routes: [{ name: 'qux' }] } },
        ],
      }}>
      <TestNavigator>
        <Screen name="foo" options={{ x: 1 }}>
          {() => null}
        </Screen>
        <Screen name="bar" options={{ y: 2 }}>
          {() => null}
        </Screen>
        <Screen name="baz" options={{ v: 3 }}>
          {() => (
            <TestNavigator>
              <Screen name="qux" options={{ g: 5 }}>
                {() => null}
              </Screen>
              <Screen name="quxx" options={{ h: 9 }}>
                {() => null}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  type ListenerType = EventListenerCallback<NavigationContainerEventMap, 'options'>;
  const listener = jest.fn<ReturnType<ListenerType>, Parameters<ListenerType>>();

  render(element).update(element);
  ref.current?.addListener('options', listener);

  act(() => {
    ref.current?.dispatchSync(CommonActions.navigate('bar'));
  });

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.calls[0]![0].data.options).toEqual({ y: 2 });
  expect(ref.current?.getCurrentOptions()).toEqual({ y: 2 });

  act(() => {
    ref.current?.dispatchSync(CommonActions.navigate('foo'));
  });

  expect(listener).toHaveBeenCalledTimes(2);
  expect(listener.mock.calls[1]![0].data.options).toEqual({ x: 1 });

  ref.current?.removeListener('options', listener);

  const listener2 = jest.fn<ReturnType<ListenerType>, Parameters<ListenerType>>();

  ref.current?.addListener('options', listener2);

  act(() => {
    ref.current?.dispatchSync(CommonActions.navigate('baz'));
  });

  expect(listener2).toHaveBeenCalledTimes(1);
  expect(listener2.mock.calls[0]![0].data.options).toEqual({ g: 5 });
  expect(ref.current?.getCurrentOptions()).toEqual({ g: 5 });

  act(() => {
    ref.current?.dispatchSync(CommonActions.navigate('quxx'));
  });

  expect(listener2).toHaveBeenCalledTimes(2);
  expect(listener2.mock.calls[1]![0].data.options).toEqual({ h: 9 });
  expect(ref.current?.getCurrentOptions()).toEqual({ h: 9 });
});

test('does not emit options from an unfocused nested navigator', () => {
  const NoFocusMockRouter = (options: DefaultRouterOptions) => ({
    ...MockRouter(options),
    shouldActionChangeFocus: () => false,
  });
  const TestNavigator = React.forwardRef(function TestNavigator(props: any, ref: any): any {
    const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(
      NoFocusMockRouter,
      props
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  });
  const child = React.createRef<any>();
  const ref = createNavigationContainerRef<ParamListBase>();
  const listener = jest.fn();

  render(
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        routes: [
          { name: 'first' },
          { name: 'nested', state: { routes: [{ name: 'third' }, { name: 'fourth' }] } },
        ],
      }}>
      <TestNavigator>
        <Screen name="first" options={{ x: 1 }}>
          {() => null}
        </Screen>
        <Screen name="nested">
          {() => (
            <TestNavigator ref={child}>
              <Screen name="third" options={{ g: 5 }}>
                {() => null}
              </Screen>
              <Screen name="fourth" options={{ h: 9 }}>
                {() => null}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );
  ref.current?.addListener('options', listener);

  act(() => child.current.navigate('fourth'));

  expect(ref.current?.getCurrentRoute()?.name).toBe('first');
  expect(listener).not.toHaveBeenCalled();
  expect(ref.current?.getCurrentOptions()).toEqual({ x: 1 });
});

test('emits option events when options change with stack router', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        type: 'stack',
        routeNames: ['foo', 'bar', 'baz'],
        routes: [
          { name: 'foo' },
          { name: 'baz', state: { type: 'stack', routes: [{ name: 'qux' }] } },
        ],
      }}>
      <TestNavigator>
        <Screen name="foo" options={{ x: 1 }}>
          {() => null}
        </Screen>
        <Screen name="bar" options={{ y: 2 }}>
          {() => null}
        </Screen>
        <Screen name="baz" options={{ v: 3 }}>
          {() => (
            <TestNavigator>
              <Screen name="qux" options={{ g: 5 }}>
                {() => null}
              </Screen>
              <Screen name="quxx" options={{ h: 9 }}>
                {() => null}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  type ListenerType = EventListenerCallback<NavigationContainerEventMap, 'options'>;
  const listener = jest.fn<ReturnType<ListenerType>, Parameters<ListenerType>>();

  render(element).update(element);
  ref.current?.addListener('options', listener);

  act(() => {
    ref.current?.dispatchSync(CommonActions.navigate('bar'));
  });

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.calls[0]![0].data.options).toEqual({ y: 2 });
  expect(ref.current?.getCurrentOptions()).toEqual({ y: 2 });

  ref.current?.removeListener('options', listener);

  const listener2 = jest.fn<ReturnType<ListenerType>, Parameters<ListenerType>>();

  ref.current?.addListener('options', listener2);

  act(() => {
    ref.current?.dispatchSync(CommonActions.navigate('baz'));
  });

  expect(listener2).toHaveBeenCalledTimes(1);
  expect(listener2.mock.calls[0]![0].data.options).toEqual({ g: 5 });
  expect(ref.current?.getCurrentOptions()).toEqual({ g: 5 });

  act(() => {
    ref.current?.dispatchSync(CommonActions.navigate('quxx'));
  });

  expect(listener2).toHaveBeenCalledTimes(2);
  expect(listener2.mock.calls[1]![0].data.options).toEqual({ h: 9 });
  expect(ref.current?.getCurrentOptions()).toEqual({ h: 9 });
});

test('throws if there is no navigator rendered', () => {
  expect.assertions(1);

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = <BaseNavigationContainer ref={ref}>{null}</BaseNavigationContainer>;

  render(element);

  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  ref.current?.dispatch({ type: 'WHATEVER' });

  expect(spy.mock.calls[0]![0]).toMatch("The 'navigation' object hasn't been initialized yet.");

  spy.mockRestore();
});

test("throws if the ref hasn't finished initializing", () => {
  expect.assertions(1);

  const ref = createNavigationContainerRef<ParamListBase>();

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => {
    React.useEffect(() => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      ref.current?.dispatch({ type: 'WHATEVER' });

      expect(spy.mock.calls[0]![0]).toMatch("The 'navigation' object hasn't been initialized yet.");

      spy.mockRestore();
    }, []);

    return null;
  };

  const element = (
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);
});

test('fires onReady after navigator is rendered', () => {
  const ref = createNavigationContainerRef<ParamListBase>();

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const onReady = jest.fn();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      onReady={onReady}
      initialState={{ routes: [{ name: 'foo' }] }}>
      {null}
    </BaseNavigationContainer>
  );

  const root = render(element);

  expect(onReady).not.toHaveBeenCalled();
  expect(ref.current?.isReady()).toBe(false);

  root.rerender(
    <BaseNavigationContainer
      ref={ref}
      onReady={onReady}
      initialState={{ routes: [{ name: 'foo' }] }}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(onReady).toHaveBeenCalledTimes(1);
  expect(ref.current?.isReady()).toBe(true);
});

// TODO(@ubax): restore when unhandled actions are wired to the reducer. https://linear.app/expo/issue/ENG-26123
test.skip('invokes the unhandled action listener with the unhandled action', () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  const fn = jest.fn();

  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = () => <></>;

  render(
    <BaseNavigationContainer ref={ref} onUnhandledAction={fn}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => {
    ref.current!.navigate('bar');
  });
  act(() => {
    ref.current!.navigate('baz');
  });

  expect(fn).toHaveBeenCalledWith({
    payload: {
      name: 'baz',
    },
    type: 'NAVIGATE',
  });
});

test('warns for duplicate route names nested inside each other', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => <></>;

  const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const first = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="foo" component={TestScreen} />
              <Screen name="baz" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>,
    { wrapper: RouterRegistryProvider }
  );

  expect(spy.mock.calls[0]![0]).toMatch(
    'Found screens with the same name nested inside one another.'
  );
  first.unmount();

  const second = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="qux">
          {() => (
            <TestNavigator>
              <Screen name="foo">
                {() => (
                  <TestNavigator>
                    <Screen name="foo" component={TestScreen} />
                    <Screen name="baz" component={TestScreen} />
                  </TestNavigator>
                )}
              </Screen>
              <Screen name="bar" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>,
    { wrapper: RouterRegistryProvider }
  );

  expect(spy.mock.calls[1]![0]).toMatch(
    'Found screens with the same name nested inside one another.'
  );
  second.unmount();

  render(
    <BaseNavigationContainer>
      <TestNavigator initialRouteName="bar">
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar">
          {() => (
            <TestNavigator>
              <Screen name="foo" component={TestScreen} />
              <Screen name="baz" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>,
    { wrapper: RouterRegistryProvider }
  );

  expect(spy).toHaveBeenCalledTimes(2);

  spy.mockRestore();
});
