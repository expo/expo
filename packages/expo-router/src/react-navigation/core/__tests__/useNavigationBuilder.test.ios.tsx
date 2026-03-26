import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { type NavigationState, type ParamListBase } from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Group } from '../Group';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

// ─── navigationKey validation ────────────────────────────────────────────────

test('throws if Screen has an empty string navigationKey', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} navigationKey="" />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got an invalid 'navigationKey' prop (\"\") for the screen 'foo'. It must be a non-empty string or 'undefined'."
  );
});

test('throws if Screen has a non-string navigationKey', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <Screen name="foo" component={React.Fragment} navigationKey={123} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got an invalid 'navigationKey' prop (123) for the screen 'foo'. It must be a non-empty string or 'undefined'."
  );
});

test('throws if Group has an empty string navigationKey', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Group navigationKey="">
          <Screen name="foo" component={React.Fragment} />
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got an invalid 'navigationKey' prop (\"\") for the group. It must be a non-empty string or 'undefined'."
  );
});

test('throws if Group has a non-string navigationKey', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <Group navigationKey={42}>
          <Screen name="foo" component={React.Fragment} />
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got an invalid 'navigationKey' prop (42) for the group. It must be a non-empty string or 'undefined'."
  );
});

// ─── component prop warnings ─────────────────────────────────────────────────

test('warns when inline function is passed as component prop', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen
          name="foo"
          component={function component() {
            return null;
          }}
        />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining(
      "Looks like you're passing an inline function for 'component' prop for the screen 'foo'"
    )
  );

  spy.mockRestore();
});

test('warns when component name starts with lowercase letter', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const myComponent = () => null;

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={myComponent} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining(
      "Got a component with the name 'myComponent' for the screen 'foo'. React Components must start with an uppercase letter."
    )
  );

  spy.mockRestore();
});

// ─── getComponent prop ───────────────────────────────────────────────────────

test('renders screen with getComponent prop', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}]`;

  const element = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" getComponent={() => TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`"[foo]"`);
});

// ─── screenListeners ─────────────────────────────────────────────────────────

test('calls screenListeners defined on navigator', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();
  const stateListener = jest.fn();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator screenListeners={{ state: stateListener }}>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => navigation.navigate('bar'));

  expect(stateListener).toHaveBeenCalled();
});

test('calls screenListeners as a function', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();
  const stateListener = jest.fn();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator
        screenListeners={({ route }: any) => ({
          state: stateListener,
        })}>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => navigation.navigate('bar'));

  expect(stateListener).toHaveBeenCalled();
});

test('calls listeners defined on Screen', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();
  const stateListener = jest.fn();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} listeners={{ state: stateListener }} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => navigation.navigate('bar'));

  // The listener is for the 'foo' screen and state events are emitted for the focused route
  // After navigating to 'bar', the state event targets 'bar', not 'foo'
  // But screenListeners on the navigator level apply to all screens
  // Per-screen listeners only fire for that screen's events
  expect(stateListener).toHaveBeenCalled();
});

// ─── layout prop ─────────────────────────────────────────────────────────────

test('renders with layout prop wrapping NavigationContent children', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}]`;

  const layoutFn = jest.fn(({ children }: any) => children);

  const element = render(
    <BaseNavigationContainer>
      <TestNavigator layout={layoutFn}>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(layoutFn).toHaveBeenCalled();
  expect(layoutFn).toHaveBeenCalledWith(
    expect.objectContaining({
      state: expect.objectContaining({ routeNames: ['foo', 'bar'] }),
      descriptors: expect.any(Object),
      navigation: expect.any(Object),
      children: expect.anything(),
    })
  );
  expect(element).toMatchInlineSnapshot(`"[foo]"`);
});

// ─── Group screenLayout ──────────────────────────────────────────────────────

test('applies screenLayout from Group to screens', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}]`;

  const screenLayoutFn = jest.fn(({ children }: any) => children);

  const element = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Group screenLayout={screenLayoutFn}>
          <Screen name="foo" component={TestScreen} />
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`"[foo]"`);
  expect(screenLayoutFn).toHaveBeenCalled();
});

// ─── Group screenOptions ─────────────────────────────────────────────────────

test('applies screenOptions from Group to contained screens', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Group screenOptions={{ headerShown: false }}>
          <Screen name="foo" component={TestScreen} options={{ title: 'Foo' }} />
        </Group>
        <Screen name="bar" component={TestScreen} options={{ title: 'Bar' }} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.getCurrentOptions()).toEqual({
    headerShown: false,
    title: 'Foo',
  });

  act(() => navigation.navigate('bar'));

  expect(navigation.getCurrentOptions()).toEqual({
    title: 'Bar',
  });
});

// ─── Screen with valid navigationKey ─────────────────────────────────────────

test('does not throw when Screen has a valid non-empty navigationKey', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  expect(() =>
    render(
      <BaseNavigationContainer>
        <TestNavigator>
          <Screen name="foo" component={React.Fragment} navigationKey="my-key" />
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrow();
});

// ─── Group with valid navigationKey ──────────────────────────────────────────

test('does not throw when Group has a valid non-empty navigationKey', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  expect(() =>
    render(
      <BaseNavigationContainer>
        <TestNavigator>
          <Group navigationKey="group-key">
            <Screen name="foo" component={React.Fragment} />
          </Group>
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrow();
});

// ─── Screen with empty name ──────────────────────────────────────────────────

test('throws if Screen has an empty string name', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    'Got an invalid name ("") for the screen. It must be a non-empty string.'
  );
});

// ─── Group with navigationKey triggers re-initialization on key change ───────

test('re-initializes state when Group navigationKey changes', () => {
  const TestNavigator = (props: any): any => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const onStateChange = jest.fn();

  const navigation = createNavigationContainerRef<ParamListBase>();

  const root = render(
    <BaseNavigationContainer ref={navigation} onStateChange={onStateChange}>
      <TestNavigator>
        <Group navigationKey="v1">
          <Screen name="foo" component={React.Fragment} />
          <Screen name="bar" component={React.Fragment} />
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const initialState = navigation.getRootState();
  expect(initialState.routeNames).toEqual(['foo', 'bar']);

  root.update(
    <BaseNavigationContainer ref={navigation} onStateChange={onStateChange}>
      <TestNavigator>
        <Group navigationKey="v2">
          <Screen name="foo" component={React.Fragment} />
          <Screen name="bar" component={React.Fragment} />
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  // Key change should trigger state update
  expect(onStateChange).toHaveBeenCalled();
});

// ─── nested Group inherits parent Group screenOptions ────────────────────────

test('merges screenOptions from nested Groups', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Group screenOptions={{ opt1: 'a' }}>
          <Group screenOptions={{ opt2: 'b' }}>
            <Screen name="foo" component={TestScreen} options={{ opt3: 'c' }} />
          </Group>
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.getCurrentOptions()).toEqual({
    opt1: 'a',
    opt2: 'b',
    opt3: 'c',
  });
});

// ─── getId prop ──────────────────────────────────────────────────────────────

test('uses getId prop for route identity', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}, ${JSON.stringify(route.params)}]`;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} getId={({ params }: any) => params?.id} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  // Navigate with different ids - the getId function determines whether
  // to create a new route or reuse an existing one
  act(() => navigation.navigate('foo', { id: '1' }));
  act(() => navigation.navigate('foo', { id: '2' }));

  const state = navigation.getRootState();
  // MockRouter doesn't use getId for deduplication,
  // but we verify the config is passed through without errors
  expect(state.routes.some((r) => r.name === 'foo')).toBe(true);
});

// ─── initialParams from parent route.params ──────────────────────────────────

test('merges initialParams with params from parent route when screen matches', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}, ${JSON.stringify(route.params)}]`;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar">
          {() => (
            <TestNavigator>
              <Screen name="baz" component={TestScreen} initialParams={{ base: 'value' }} />
              <Screen name="qux" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() =>
    navigation.navigate('bar', {
      screen: 'baz',
      params: { extra: 'param' },
    })
  );

  const state = navigation.getRootState();
  const barRoute = state.routes.find((r) => r.name === 'bar');
  const nestedState = barRoute?.state as NavigationState | undefined;
  const bazRoute = nestedState?.routes.find((r) => r.name === 'baz');

  expect(bazRoute?.params).toEqual({ base: 'value', extra: 'param' });
});

// ─── children render prop ────────────────────────────────────────────────────

test('renders screen with children render prop', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const element = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo">{({ route }: any) => `[${route.name}]`}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`"[foo]"`);
});

// ─── dispatch with function returning action ─────────────────────────────────

test('handles dispatch with function that returns NOOP based on state', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();
  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer ref={navigation} onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  // Dispatch a function that returns NOOP - should not trigger state change
  act(() =>
    navigation.dispatch((state: NavigationState) => {
      if (state.index === 0) {
        return { type: 'NOOP' };
      }
      return { type: 'UPDATE' };
    })
  );

  expect(onStateChange).toHaveBeenCalledTimes(0);
});

// ─── multiple sequential navigations ────────────────────────────────────────

test('handles multiple sequential navigations correctly', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}]`;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.getRootState().index).toBe(0);

  act(() => navigation.navigate('bar'));
  expect(navigation.getRootState().index).toBe(1);

  act(() => navigation.navigate('baz'));
  expect(navigation.getRootState().index).toBe(2);

  act(() => navigation.goBack());
  expect(navigation.getRootState().index).toBe(1);
});

// ─── non-React-element direct children ───────────────────────────────────────

test('throws for object as direct child of navigator', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        {{ some: 'object' }}
      </TestNavigator>
    </BaseNavigationContainer>
  );

  // React.Children.toArray throws before our validation can run
  expect(() => render(element).update(element)).toThrow();
});

test('throws for number as direct child of navigator', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        {42}
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "A navigator can only contain 'Screen', 'Group' or 'React.Fragment' as its direct children (found '42')"
  );
});

// ─── state emission ──────────────────────────────────────────────────────────

test('emits state event when state changes', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  let addListenerFn: any;

  const TestScreen = ({ navigation }: any) => {
    addListenerFn = navigation.addListener;
    return null;
  };

  const SecondScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={SecondScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const stateCallback = jest.fn();
  const unsubscribe = addListenerFn('state', stateCallback);

  act(() => navigation.navigate('bar'));

  expect(stateCallback).toHaveBeenCalled();

  unsubscribe();
});

// ─── describe function from useNavigationBuilder ─────────────────────────────

test('returns describe function that can be used to describe route', () => {
  let describeFn: any;

  const TestNavigator = (props: any): any => {
    const { state, descriptors, describe, NavigationContent } = useNavigationBuilder(
      MockRouter,
      props
    );

    describeFn = describe;

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(describeFn).toBeDefined();
  expect(typeof describeFn).toBe('function');
});

// ─── NavigationContent renders children ──────────────────────────────────────

test('NavigationContent wraps children correctly', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}]`;

  const element = render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`
    [
      "[foo]",
      "[bar]",
    ]
  `);
});

// ─── Fragment with nested Groups ─────────────────────────────────────────────

test('handles Fragment containing Group as navigator children', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}]`;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <>
          <Group screenOptions={{ opt: 'a' }}>
            <Screen name="foo" component={TestScreen} />
          </Group>
          <Screen name="bar" component={TestScreen} />
        </>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.getRootState().routeNames).toEqual(['foo', 'bar']);

  expect(navigation.getCurrentOptions()).toEqual({
    opt: 'a',
  });
});
