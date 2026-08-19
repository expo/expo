import { act, render, renderHook } from '@testing-library/react-native';
import * as React from 'react';
import { use, useEffect } from 'react';

import { CommonActions, type ParamListBase, StackActions, StackRouter } from '../../routers';
import { type PreventedRoutes, PreventRemoveContext } from '../PreventRemoveContext';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { getPreventableRoutes } from '../useOnPreventRemove';
import { usePreventRemove } from '../usePreventRemove';
import { usePreventRemoveContext } from '../usePreventRemoveContext';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouterKey } from './__fixtures__/MockRouter';

jest.mock('nanoid/non-secure', () => {
  const m = { nanoid: () => String(++m.__key), __key: 0 };

  return m;
});

beforeEach(() => {
  MockRouterKey.current = 0;

  require('nanoid/non-secure').__key = 0;
});

test('throws when the prevent remove context is missing', () => {
  expect(() => renderHook(() => usePreventRemoveContext())).toThrow(
    "Couldn't find the prevent remove context. Is your component inside NavigationContent?"
  );
});

test('throws when registering a route outside the navigation state', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  let setPreventRemove: NonNullable<
    React.ContextType<typeof PreventRemoveContext>
  >['setPreventRemove'];
  const TestScreen = () => {
    setPreventRemove = usePreventRemoveContext().setPreventRemove;
    return null;
  };

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => act(() => setPreventRemove('test', 'missing', true))).toThrow(
    "Couldn't find a route with the key missing. Is your component inside NavigationContent?"
  );
});

test('only enables preventRemove after a preloaded screen is promoted', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const onPreventRemove = jest.fn();
  let preventedRoutes: PreventedRoutes | undefined;
  const ProtectedScreen = () => {
    usePreventRemove(true, onPreventRemove);
    preventedRoutes = use(PreventRemoveContext)?.preventedRoutes;
    return null;
  };
  const ref = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second">{() => null}</Screen>
        <Screen name="protected" component={ProtectedScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => {
    ref.current?.navigate('second');
    ref.current?.dispatch(CommonActions.preload('protected'));
  });
  const preloadedRoute = ref.current?.getRootState().routes.at(-1)!;

  expect(preventedRoutes?.[preloadedRoute.key]).toBeUndefined();
  act(() => ref.current?.goBack());

  expect(onPreventRemove).not.toHaveBeenCalled();
  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual([
    'first',
    'protected',
  ]);
  expect(ref.current?.getRootState().index).toBe(0);

  act(() => ref.current?.navigate('protected'));
  const promotedState = ref.current?.getRootState();

  expect(preventedRoutes?.[preloadedRoute.key]).toEqual({ preventRemove: true });
  act(() => ref.current?.goBack());

  expect(onPreventRemove).toHaveBeenCalledTimes(1);
  expect(ref.current?.getRootState()).toEqual(promotedState);
});

test('does not propagate preventRemove from a preloaded nested stack', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const onPreventRemove = jest.fn();
  let parentPreventedRoutes: PreventedRoutes | undefined;
  const ProtectedScreen = () => {
    usePreventRemove(true, onPreventRemove);
    return null;
  };
  const ParentPreventedRoutesObserver = () => {
    parentPreventedRoutes = use(PreventRemoveContext)?.preventedRoutes;
    return null;
  };
  const NestedStack = (props: any) => {
    const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(
      StackRouter,
      props
    );

    useEffect(() => navigation.dispatch(CommonActions.preload('protected')), [navigation]);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const ref = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        type: 'stack',
        index: 0,
        routes: [
          { name: 'home' },
          {
            name: 'nested',
            state: { type: 'stack', routes: [{ name: 'index' }] },
          },
        ],
      }}>
      <TestNavigator>
        <Screen name="home">{() => null}</Screen>
        <Screen name="nested">
          {() => (
            <>
              <ParentPreventedRoutesObserver />
              <NestedStack>
                <Screen name="index">{() => null}</Screen>
                <Screen name="protected" component={ProtectedScreen} />
              </NestedStack>
            </>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => ref.current?.navigate('nested'));
  const nestedRoute = ref.current?.getRootState().routes.at(-1)!;

  expect(parentPreventedRoutes?.[nestedRoute.key]).toBeUndefined();
  act(() => ref.current?.goBack());

  expect(onPreventRemove).not.toHaveBeenCalled();
  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['home']);
});

test('only active stack routes are preventable', () => {
  const routes = [
    { key: 'a', name: 'a' },
    { key: 'b', name: 'b' },
    { key: 'p1', name: 'p1' },
    { key: 'p2', name: 'p2' },
  ];

  expect(
    getPreventableRoutes({
      stale: false,
      routeKeySeq: 0,
      type: 'stack',
      key: 'stack',
      index: 1,
      routeNames: routes.map((route) => route.name),
      routes,
    })
  ).toEqual(routes.slice(0, 2));

  expect(
    getPreventableRoutes({
      stale: false,
      routeKeySeq: 0,
      type: 'tab',
      key: 'tabs',
      index: 1,
      routeNames: routes.map((route) => route.name),
      routes,
    })
  ).toEqual(routes);

  expect(
    getPreventableRoutes(
      {
        index: 0,
        routes,
      },
      'stack'
    )
  ).toEqual(routes.slice(0, 1));
});

test("prevents removing a screen with 'usePreventRemove' hook", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onPreventRemove = jest.fn();

  let setPreventRemove: React.Dispatch<React.SetStateAction<boolean>>;

  const TestScreen = () => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    setPreventRemove = setPreventRemoveState;
    usePreventRemove(preventRemove, () => {
      onPreventRemove();
    });

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
      { key: 'baz:3-1', name: 'baz' },
    ],
    stale: false,
    routeKeySeq: 2,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

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

  act(() => setPreventRemove(false));

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

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

test('dispatches a blocked action from an effect after disabling prevention', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  let discard: () => void;
  const onPreventRemove = jest.fn();
  const TestScreen = ({ navigation }: any) => {
    const [preventRemove, setPreventRemove] = React.useState(true);
    const pendingAction = React.useRef<any>(null);
    usePreventRemove(preventRemove, ({ data }) => {
      pendingAction.current = data.action;
      onPreventRemove();
    });
    React.useEffect(() => {
      if (!preventRemove && pendingAction.current) {
        navigation.dispatch(pendingAction.current);
      }
    }, [navigation, preventRemove]);
    discard = () => setPreventRemove(false);
    return null;
  };
  const ref = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.goBack());
  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo', 'bar']);
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

  act(() => discard());
  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo']);
  expect(onPreventRemove).toHaveBeenCalledTimes(1);
});

test("prevents removing a screen when 'usePreventRemove' hook is called multiple times", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onPreventRemove = jest.fn();

  let setPreventRemove: React.Dispatch<React.SetStateAction<boolean>>;

  const TestScreen = () => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    setPreventRemove = setPreventRemoveState;
    usePreventRemove(false, () => {});
    usePreventRemove(preventRemove, () => {
      onPreventRemove();
    });
    usePreventRemove(false, () => {});

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
      { key: 'baz:3-1', name: 'baz' },
    ],
    stale: false,
    routeKeySeq: 2,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

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

  act(() => setPreventRemove(false));

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

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

test("should have no effect when 'usePreventRemove' hook is set to false", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onPreventRemove = jest.fn();

  const TestScreen = () => {
    usePreventRemove(false, () => {
      onPreventRemove();
    });

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
      { key: 'baz:3-1', name: 'baz' },
    ],
    stale: false,
    routeKeySeq: 2,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(3);

  expect(ref.current?.getRootState()).toEqual({
    type: 'stack',
    index: 0,
    key: 'navigator-3',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-2', name: 'foo' }],
    stale: false,
    routeKeySeq: 2,
  });

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(5);
  expect(onStateChange).toHaveBeenCalledWith({
    type: 'stack',
    index: 0,
    key: 'navigator-3',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-2', name: 'foo' }],
    stale: false,
    routeKeySeq: 3,
  });

  expect(onPreventRemove).toHaveBeenCalledTimes(0);
});

test("prevents removing a child screen with 'usePreventRemove' hook", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onPreventRemove = jest.fn();

  let setPreventRemove: React.Dispatch<React.SetStateAction<boolean>>;

  const TestScreen = () => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    setPreventRemove = setPreventRemoveState;
    usePreventRemove(preventRemove, () => {
      onPreventRemove();
    });

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

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => setPreventRemove(false));

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(4);
  expect(ref.current?.getRootState()).toMatchObject({
    index: 0,
    routes: [{ name: 'foo' }],
  });
});

test("prevents removing a grand child screen with 'usePreventRemove' hook", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onPreventRemove = jest.fn();

  let setPreventRemove: React.Dispatch<React.SetStateAction<boolean>>;

  const TestScreen = () => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    setPreventRemove = setPreventRemoveState;
    usePreventRemove(preventRemove, () => {
      onPreventRemove();
    });

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

  expect(onStateChange).toHaveBeenCalledTimes(2);
  const preventedState = ref.current!.getRootState();
  expect(onStateChange).toHaveBeenLastCalledWith(preventedState);

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => setPreventRemove(false));

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(4);
  expect(ref.current?.getRootState()).toMatchObject({
    index: 0,
    routes: [{ name: 'foo' }],
  });
});

test("prevents removing by multiple screens with 'usePreventRemove' hook", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const onPreventRemove = {
    bar: jest.fn(),
    baz: jest.fn(),
    lex: jest.fn(),
  };

  const setPreventRemove: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {};

  const TestScreen = (props: any) => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    setPreventRemove[props.route.name] = setPreventRemoveState;
    usePreventRemove(preventRemove, () => {
      // @ts-expect-error: we should have the required mocks
      onPreventRemove[props.route.name]();
    });

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
  onStateChange.mockClear();

  act(() => {
    ref.current?.navigate('bar');
    ref.current?.navigate('baz');
    ref.current?.navigate('bax');
  });

  const preventedState = ref.current!.getRootState();

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith(preventedState);

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onPreventRemove.lex).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => {
    setPreventRemove.lex!(false);
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onPreventRemove.baz).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => {
    setPreventRemove.baz!(false);
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onPreventRemove.bar).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => {
    setPreventRemove.bar!(false);
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(ref.current?.getRootState()).toMatchObject({
    index: 0,
    routes: [{ name: 'foo' }],
  });
});

test("prevents removing a child screen with 'usePreventRemove' hook with 'resetRoot'", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const shouldContinue = false;

  const TestScreen = (props: any) => {
    usePreventRemove(true, ({ data }) => {
      if (shouldContinue) {
        props.navigation.dispatch(data.action);
      }
    });

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
          { name: 'baz', state: { type: 'stack', routes: [{ name: 'qux' }] } },
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

  expect(onStateChange).toHaveBeenCalledTimes(1);
  const preventedState = ref.current!.getRootState();
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

  expect(ref.current?.getRootState()).toEqual(preventedState);
});
