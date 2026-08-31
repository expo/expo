import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { CommonActions, type ParamListBase, StackActions, StackRouter } from '../../routers';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { usePreventRemove } from '../usePreventRemove';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouterKey } from './__fixtures__/MockRouter';

jest.mock('nanoid/non-secure', () => {
  const m = { nanoid: () => String(++m.__key), __key: 0 };

  return m;
});

let consoleWarnSpy: jest.SpyInstance;

beforeEach(() => {
  MockRouterKey.current = 0;

  require('nanoid/non-secure').__key = 0;
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => consoleWarnSpy.mockRestore());

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

test('allows an action dispatched while disabling prevention', () => {
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
  const TestScreen = () => {
    const [preventRemove, setPreventRemove] = React.useState(true);
    const disablePrevention = usePreventRemove(preventRemove, onPreventRemove);
    discard = () => {
      setPreventRemove(false);
      disablePrevention();
      ref.current?.goBack();
    };
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

test('warns when disablePrevention is called and preventRemove stays true', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  let disablePrevention!: () => void;
  const TestScreen = () => {
    disablePrevention = usePreventRemove(true);
    return null;
  };

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(disablePrevention);

  expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
});

test('does not warn when preventRemove is set to false with disablePrevention', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  let discard!: () => void;
  const TestScreen = () => {
    const [preventRemove, setPreventRemove] = React.useState(true);
    const disablePrevention = usePreventRemove(preventRemove);
    discard = () => {
      setPreventRemove(false);
      disablePrevention();
    };
    return null;
  };

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(discard);

  expect(consoleWarnSpy).not.toHaveBeenCalled();
});

test('does not propagate prevention from a preloaded nested stack route', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const onPreventRemove = jest.fn();
  const ProtectedScreen = () => {
    usePreventRemove(true, onPreventRemove);
    return null;
  };
  let preloadProtected!: () => void;
  const NestedStack = (props: any) => {
    const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(
      StackRouter,
      props
    );
    preloadProtected = () => navigation.dispatch(CommonActions.preload('protected'));
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
          { name: 'nested', state: { type: 'stack', routes: [{ name: 'index' }] } },
        ],
      }}>
      <TestNavigator>
        <Screen name="home">{() => null}</Screen>
        <Screen name="nested">
          {() => (
            <NestedStack>
              <Screen name="index">{() => null}</Screen>
              <Screen name="protected" component={ProtectedScreen} />
            </NestedStack>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(preloadProtected);
  expect(ref.current?.getRootState().routes[1]?.state?.routes.map((route) => route.name)).toEqual([
    'index',
    'protected',
  ]);
  act(() => ref.current?.navigate('nested'));
  act(() => ref.current?.goBack());

  expect(onPreventRemove).not.toHaveBeenCalled();
  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['home']);
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
  expect(onPreventRemove.baz).toHaveBeenCalledTimes(1);
  expect(onPreventRemove.bar).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => {
    setPreventRemove.lex!(false);
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onPreventRemove.baz).toHaveBeenCalledTimes(2);
  expect(onPreventRemove.bar).toHaveBeenCalledTimes(2);

  expect(ref.current?.getRootState()).toEqual(preventedState);

  act(() => {
    setPreventRemove.baz!(false);
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onPreventRemove.bar).toHaveBeenCalledTimes(3);

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

test("prevents removing a child screen with 'usePreventRemove' hook with targeted reset", () => {
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
    ref.current?.dispatch({
      ...CommonActions.reset({
        index: 0,
        key: preventedState.key,
        routeNames: preventedState.routeNames,
        routes: [preventedState.routes[0]!],
        stale: false,
        routeKeySeq: 0,
      }),
      target: preventedState.key,
    })
  );

  expect(onStateChange).toHaveBeenCalledTimes(1);

  expect(ref.current?.getRootState()).toEqual(preventedState);
});
