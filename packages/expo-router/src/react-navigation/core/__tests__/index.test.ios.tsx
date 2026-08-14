import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import {
  DrawerRouter,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type Router,
  StackRouter,
  TabRouter,
} from '../../routers';
import { Group } from '../Group';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigation } from '../useNavigation';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

let mockNanoidCounter = 0;
jest.mock('nanoid/non-secure', () => ({ nanoid: jest.fn(() => String(mockNanoidCounter++)) }));

beforeEach(() => {
  mockNanoidCounter = 0;
  MockRouterKey.current = 0;
});

test.each([
  ['StackRouter', StackRouter],
  ['TabRouter', TabRouter],
  ['DrawerRouter', DrawerRouter],
  ['typeless custom router', MockRouter],
])('%s receives the shared sparse fresh state', (_name, createRouter) => {
  let state: NavigationState | undefined;

  const TestNavigator = (props: any): any => {
    state = useNavigationBuilder(createRouter, props).state;
    return null;
  };

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="first" component={React.Fragment} />
        <Screen name="second" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(state).toEqual({
    stale: false,
    key: 'navigator-2',
    index: 0,
    routeNames: ['first', 'second'],
    routes: [{ key: 'first-1', name: 'first' }],
  });
});

test('initializes state for a navigator on navigation', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={React.Fragment} />
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={React.Fragment} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-1', name: 'foo' }],
  });
});

test("doesn't crash when initialState is null", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const element = (
    // @ts-expect-error: we're explicitly passing null for state
    <BaseNavigationContainer initialState={null}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element)).not.toThrow();
});

test('throws for incorrect initialRouteName', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  expect(() =>
    render(
      <BaseNavigationContainer>
        <TestNavigator initialRouteName="qux">
          <Screen name="foo" component={TestScreen} />
          <Screen name="bar" component={TestScreen} />
          <Screen name="baz" component={TestScreen} />
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).toThrow("Couldn't find a screen named 'qux' to use as 'initialRouteName'");

  expect(() =>
    render(
      <BaseNavigationContainer>
        <TestNavigator initialRouteName="bar">
          <Screen name="foo" component={TestScreen} />
          <Screen name="bar" component={TestScreen} />
          <Screen name="baz" component={TestScreen} />
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrow();
});

test('rehydrates state for a navigator on navigation', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const BarScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const initialState = {
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
    ],
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer initialState={initialState} onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={BarScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toHaveBeenLastCalledWith({
    index: 1,
    key: '0',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo', name: 'foo', params: undefined },
      { key: 'bar', name: 'bar', params: undefined },
    ],
    stale: false,
    type: 'test',
  });
});

test("doesn't rehydrate state if the type of state didn't match router", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const initialState = {
    index: 1,
    type: 'something-else',
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'bar', name: 'bar' },
    ],
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer initialState={initialState} onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toHaveBeenLastCalledWith({
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [{ key: 'foo-1', name: 'foo' }],
    stale: false,
  });
});

test('initializes state for nested screens in React.Fragment', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <>
          <Screen name="bar" component={React.Fragment} />
          <Screen name="baz" component={React.Fragment} />
        </>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-1', name: 'foo' }],
  });
});

test('initializes state for nested screens in Group', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Group>
          <Screen name="bar" component={React.Fragment} />
          <Screen name="baz" component={React.Fragment} />
        </Group>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo-1', name: 'foo' }],
  });
});

test('initializes state for nested navigator on navigation', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="baz">
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={React.Fragment} />
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar', 'baz'],
    routes: [
      {
        key: 'baz-1',
        name: 'baz',
        state: {
          stale: false,
          index: 0,
          key: 'navigator-6',
          routeNames: ['qux'],
          routes: [{ key: 'qux-5', name: 'qux' }],
        },
      },
    ],
  });
});

test("doesn't update state if nothing changed", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'NOOP' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toHaveBeenCalledTimes(0);
});

test("doesn't update state if action wasn't handled", () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'INVALID' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toHaveBeenCalledTimes(0);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining("The action 'INVALID' was not handled by any navigator.")
  );

  spy.mockRestore();
});

test('cleans up state when the navigator unmounts', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch({ type: 'UPDATE' });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const root = render(element);

  root.update(element);

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenLastCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [{ key: 'foo-1', name: 'foo' }],
  });

  root.update(
    <BaseNavigationContainer onStateChange={onStateChange}>{null}</BaseNavigationContainer>
  );

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenLastCalledWith(undefined);
});

test('allows state updates by dispatching a function returning an action', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const FooScreen = (props: any) => {
    React.useEffect(() => {
      props.navigation.dispatch((state: NavigationState) =>
        state.index === 0
          ? { type: 'NAVIGATE', payload: { name: state.routeNames[1] } }
          : { type: 'NOOP' }
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
  };

  const BarScreen = () => null;

  const onStateChange = jest.fn();

  const element = (
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={BarScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element).update(element);

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 1,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo-1', name: 'foo' },
      { key: 'bar-0', name: 'bar', params: undefined },
    ],
  });
});

test('re-initializes state once for conditional rendering', () => {
  const TestNavigatorA = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestNavigatorB = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const onStateChange = jest.fn();

  const navigation = createNavigationContainerRef<ParamListBase>();

  const Test = ({ condition }: { condition: boolean }) => {
    return (
      <BaseNavigationContainer ref={navigation} onStateChange={onStateChange}>
        {condition ? (
          <TestNavigatorA>
            <Screen name="foo">{() => null}</Screen>
            <Screen name="bar">{() => null}</Screen>
          </TestNavigatorA>
        ) : (
          <TestNavigatorB>
            <Screen name="bar">{() => null}</Screen>
            <Screen name="baz">{() => null}</Screen>
          </TestNavigatorB>
        )}
      </BaseNavigationContainer>
    );
  };

  const root = render(<Test condition />);

  expect(onStateChange).toHaveBeenCalledTimes(0);
  expect(navigation.getRootState()).toEqual({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [{ key: 'foo-1', name: 'foo' }],
  });

  root.update(<Test condition={false} />);

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-6',
    routeNames: ['bar', 'baz'],
    routes: [{ key: 'bar-5', name: 'bar' }],
  });
});

test('updates route params with setParams', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  let setParams: (params: object) => void = () => undefined;

  const FooScreen = (props: any) => {
    setParams = props.navigation.setParams;

    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo" component={FooScreen} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => setParams({ username: 'alice' }));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenLastCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [{ key: 'foo-1', name: 'foo', params: { username: 'alice' } }],
  });

  act(() => setParams({ age: 25 }));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenLastCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [{ key: 'foo-1', name: 'foo', params: { username: 'alice', age: 25 } }],
  });
});

test('updates route params with setParams applied to parent', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  let setParams: (params: object) => void = () => undefined;

  const FooScreen = (props: any) => {
    const parent = props.navigation.getParent();
    if (parent) {
      setParams = parent.setParams;
    }

    return null;
  };

  const onStateChange = jest.fn();

  render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo">
          {() => (
            <TestNavigator initialRouteName="baz">
              <Screen name="baz" component={FooScreen} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => setParams({ username: 'alice' }));

  expect(onStateChange).toHaveBeenCalledTimes(1);
  expect(onStateChange).toHaveBeenLastCalledWith({
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [
      {
        key: 'foo-1',
        name: 'foo',
        params: { username: 'alice' },
        state: {
          index: 0,
          key: 'navigator-6',
          routeNames: ['baz'],
          routes: [{ key: 'baz-5', name: 'baz' }],
          stale: false,
        },
      },
    ],
    stale: false,
  });

  act(() => setParams({ age: 25 }));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onStateChange).toHaveBeenLastCalledWith({
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [
      {
        key: 'foo-1',
        name: 'foo',
        params: { username: 'alice', age: 25 },
        state: {
          index: 0,
          key: 'navigator-6',
          routeNames: ['baz'],
          routes: [{ key: 'baz-5', name: 'baz' }],
          stale: false,
        },
      },
    ],
    stale: false,
  });
});

test('handles change in route names', () => {
  const TestNavigator = (props: any): any => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const onStateChange = jest.fn();

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator initialRouteName="bar">
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  root.update(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        <Screen name="baz" component={React.Fragment} />
        <Screen name="qux" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['foo', 'baz', 'qux'],
    routes: [{ key: 'foo-0', name: 'foo' }],
  });
});

test('reconciles route names when no previous route survives', () => {
  const TestNavigator = (props: any): any => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const onStateChange = jest.fn();
  const root = render(
    <BaseNavigationContainer>
      <TestNavigator initialRouteName="bar">
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  root.update(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="baz" component={React.Fragment} />
        <Screen name="qux" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(onStateChange).toHaveBeenCalledWith({
    stale: false,
    index: 0,
    key: 'navigator-2',
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'baz-0', name: 'baz' }],
  });
});

test('does not clear params if there is no nested navigator', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = ({ route }: any): any => `[${route.name}]`;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() =>
    navigation.navigate('bar', {
      screen: 'qux',
      params: { test: 42 },
    })
  );

  expect(navigation.getRootState()).toEqual({
    index: 1,
    key: 'navigator-2',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo-1', name: 'foo' },
      {
        key: 'bar-0',
        name: 'bar',
        params: {
          screen: 'qux',
          params: { test: 42 },
        },
      },
    ],
    stale: false,
  });
});

test('overrides router with UNSTABLE_router', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer
      ref={navigation}
      initialState={{
        type: 'test',
        key: 'stack',
        index: 0,
        routeNames: ['foo', 'bar'],
        routes: [{ name: 'foo' }, { name: 'bar' }],
      }}>
      <TestNavigator
        UNSTABLE_router={(
          original: Router<NavigationState, NavigationAction>
        ): Partial<Router<NavigationState, NavigationAction>> => {
          return {
            getStateForAction(state, action, options) {
              if (action.type === 'REVERSE') {
                const routes = [...state.routes].reverse();
                return {
                  state: { ...state, routes },
                  affectedRouteKey: routes[state.index]?.key,
                };
              }

              return original.getStateForAction(state, action, options);
            },
          };
        }}>
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.getRootState()).toEqual({
    type: 'test',
    index: 0,
    key: '2',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'foo-0', name: 'foo', params: undefined },
      { key: 'bar-1', name: 'bar', params: undefined },
    ],
    stale: false,
  });

  act(() => {
    navigation.dispatch({
      type: 'REVERSE',
    });
  });

  expect(navigation.getRootState()).toEqual({
    type: 'test',
    index: 0,
    key: '2',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'bar-1', name: 'bar', params: undefined },
      { key: 'foo-0', name: 'foo', params: undefined },
    ],
    stale: false,
  });

  act(() => {
    navigation.dispatch({
      type: 'NAVIGATE',
      payload: {
        name: 'foo',
      },
    });
  });

  expect(navigation.getRootState()).toEqual({
    type: 'test',
    index: 1,
    key: '2',
    routeNames: ['foo', 'bar'],
    routes: [
      { key: 'bar-1', name: 'bar', params: undefined },
      { key: 'foo-0', name: 'foo', params: undefined },
    ],
    stale: false,
  });
});

test('gets immediate parent with getParent()', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestComponent = ({ route, navigation }: any): any =>
    `${route.name} [${navigation
      .getParent()
      .getState()
      .routes.map((r: any) => r.name)
      .join()}]`;

  const onStateChange = jest.fn();

  const element = render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="foo-a">
                {() => (
                  <TestNavigator>
                    <Screen name="bar" component={TestComponent} />
                  </TestNavigator>
                )}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`"bar [foo-a]"`);
});

test('gets parent with a ID with getParent(id)', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestComponent = ({ route, navigation }: any): any =>
    `${route.name} [${navigation
      .getParent('Test')
      .getState()
      .routes.map((r: any) => r.name)
      .join()}]`;

  const onStateChange = jest.fn();

  const element = render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator id="Test">
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="foo-a">
                {() => (
                  <TestNavigator>
                    <Screen name="bar" component={TestComponent} />
                  </TestNavigator>
                )}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`"bar [foo]"`);
});

test('gets self with a ID with getParent(id)', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestComponent = ({ route, navigation }: any): any =>
    `${route.name} [${navigation
      .getParent('Test')
      .getState()
      .routes.map((r: any) => r.name)
      .join()}]`;

  const onStateChange = jest.fn();

  const element = render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator>
              <Screen name="foo-a">
                {() => (
                  <TestNavigator id="Test">
                    <Screen name="bar" component={TestComponent} />
                  </TestNavigator>
                )}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`"bar [bar]"`);
});

test('returns undefined when ID is not found with getParent(id)', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestComponent = ({ route, navigation }: any): any =>
    `${route.name} [${navigation.getParent('Tes')}]`;

  const onStateChange = jest.fn();

  const element = render(
    <BaseNavigationContainer onStateChange={onStateChange}>
      <TestNavigator>
        <Screen name="foo">
          {() => (
            <TestNavigator id="Test">
              <Screen name="foo-a">
                {() => (
                  <TestNavigator>
                    <Screen name="bar" component={TestComponent} />
                  </TestNavigator>
                )}
              </Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(element).toMatchInlineSnapshot(`"bar [undefined]"`);
});

test('gives access to internal state', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  let state: NavigationState | undefined;

  const Test = () => {
    const navigation = useNavigation();
    state = navigation.getState();
    return null;
  };

  const root = (
    <BaseNavigationContainer>
      <TestNavigator initialRouteName="bar">
        <Screen name="bar" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root).update(root);

  expect(state).toEqual({
    index: 0,
    key: 'navigator-2',
    routeNames: ['bar'],
    routes: [{ key: 'bar-1', name: 'bar' }],
    stale: false,
  });
});

test('preserves order of screens in state with non-numeric names', () => {
  const TestNavigator = (props: any): any => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  const root = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={React.Fragment} />
        <Screen name="baz" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root);

  expect(navigation.getRootState().routeNames).toEqual(['foo', 'bar', 'baz']);
});

test('preserves order of screens in state with numeric names', () => {
  const TestNavigator = (props: any): any => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  const root = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="4" component={React.Fragment} />
        <Screen name="7" component={React.Fragment} />
        <Screen name="1" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(root);

  expect(navigation.getRootState().routeNames).toEqual(['4', '7', '1']);
});

test("throws if navigator doesn't have any screens", () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator />
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Couldn't find any screens for the navigator. Have you defined any screens as its children?"
  );
});

test('throws if navigator is not inside a container', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <TestNavigator>
      <Screen name="foo" component={React.Fragment} />
    </TestNavigator>
  );

  expect(() => render(element).update(element)).toThrow(
    "Couldn't register the navigator. Have you wrapped your app with 'NavigationContainer'?"
  );
});

test('throws if multiple navigators rendered under one container', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
      </TestNavigator>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    'Another navigator is already registered for this container'
  );
});

test('throws when Screen is not the direct children', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const Bar = () => null;

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        <Bar />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "A navigator can only contain 'Screen', 'Group' or 'React.Fragment' as its direct children (found 'Bar')"
  );
});

test('throws when undefined component is a direct children', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const Undefined = undefined;

  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <Undefined name="foo" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  spy.mockRestore();

  expect(() => render(element).update(element)).toThrow(
    "A navigator can only contain 'Screen', 'Group' or 'React.Fragment' as its direct children (found 'undefined' for the screen 'foo')"
  );
});

test('throws when a tag is a direct children', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <screen name="foo" />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "A navigator can only contain 'Screen', 'Group' or 'React.Fragment' as its direct children (found 'screen' for the screen 'foo')"
  );
});

test('throws when a React Element is not the direct children', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        Hello world
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "A navigator can only contain 'Screen', 'Group' or 'React.Fragment' as its direct children (found 'Hello world')"
  );
});

test("doesn't throw when direct children is Screen or empty element", () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  render(
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        {null}
        {undefined}
        {false}
        {true}
      </TestNavigator>
    </BaseNavigationContainer>
  );
});

test('throws when multiple screens with same name are defined', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={React.Fragment} />
        <Screen name="foo" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named 'foo')"
  );
});

test('switches rendered navigators', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const root = render(
    <BaseNavigationContainer>
      <TestNavigator key="a">
        <Screen name="foo" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() =>
    root.update(
      <BaseNavigationContainer>
        <TestNavigator key="b">
          <Screen name="foo" component={React.Fragment} />
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrow('Another navigator is already registered for this container.');
});

test('throws if no name is passed to Screen', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name={undefined as any} component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    'Got an invalid name (undefined) for the screen. It must be a non-empty string.'
  );
});

test('throws if invalid name is passed to Screen', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name={[] as any} component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    'Got an invalid name ([]) for the screen. It must be a non-empty string.'
  );
});

test('throws if both children and component are passed', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment}>
          {/* @ts-expect-error testing incorrect usage */}
          {jest.fn()}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got both 'component' and 'children' props for the screen 'foo'. You must pass only one of them."
  );
});

test('throws if both children and getComponent are passed', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const Test = () => null;

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <Screen name="foo" getComponent={() => Test}>
          {() => <Test />}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got both 'getComponent' and 'children' props for the screen 'foo'. You must pass only one of them."
  );
});

test('throws if both component and getComponent are passed', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const Test = () => null;

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <Screen name="foo" component={Test} getComponent={() => Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got both 'component' and 'getComponent' props for the screen 'foo'. You must pass only one of them."
  );
});

test('throws descriptive error for undefined screen component', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <Screen name="foo" component={undefined} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Couldn't find a 'component', 'getComponent' or 'children' prop for the screen 'foo'"
  );
});

test('throws descriptive error for invalid screen component', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <Screen name="foo" component={{}} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got an invalid value for 'component' prop for the screen 'foo'. It must be a valid React Component."
  );
});

test('throws descriptive error for invalid getComponent prop', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        {/* @ts-expect-error testing incorrect usage */}
        <Screen name="foo" getComponent={{}} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got an invalid value for 'getComponent' prop for the screen 'foo'. It must be a function returning a React Component."
  );
});

test('throws descriptive error for invalid children', () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo">{[] as any}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).toThrow(
    "Got an invalid value for 'children' prop for the screen 'foo'. It must be a function returning a React Element."
  );
});

test("doesn't throw if children is null", () => {
  const TestNavigator = (props: any) => {
    useNavigationBuilder(MockRouter, props);
    return null;
  };

  const element = (
    <BaseNavigationContainer>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment}>
          {null as any}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() => render(element).update(element)).not.toThrow();
});

test('returns currently focused route with getCurrentRoute', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen name="bar-a" component={TestScreen} options={{ sample: 'data' }} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.getCurrentRoute()).toEqual({
    key: 'bar-a-5',
    name: 'bar-a',
  });
});

test("returns focused screen's options with getCurrentOptions when focused screen is rendered", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen name="bar-a" component={TestScreen} options={{ sample: '1' }} />
              <Screen name="bar-b" component={TestScreen} options={{ sample2: '2' }} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.getCurrentOptions()).toEqual({
    sample: '1',
  });

  act(() => navigation.navigate('bar-b'));

  expect(navigation.getCurrentOptions()).toEqual({
    sample2: '2',
  });
});

test("returns focused screen's options with getCurrentOptions when focused screen is rendered when using screenOptions", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a" screenOptions={() => ({ sample2: '2' })}>
              <Screen name="bar-a" component={TestScreen} options={{ sample: '1' }} />
              <Screen name="bar-b" component={TestScreen} options={{ sample3: '3' }} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.getCurrentOptions()).toEqual({
    sample: '1',
    sample2: '2',
  });

  act(() => navigation.navigate('bar-b'));

  expect(navigation.getCurrentOptions()).toEqual({
    sample2: '2',
    sample3: '3',
  });
});

test("returns focused screen's options with getCurrentOptions when focused screen is rendered when using Group", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a" screenOptions={() => ({ sample2: '2' })}>
              <Screen name="bar-a" component={TestScreen} options={{ sample: '1' }} />
              <Group screenOptions={{ sample4: '4' }}>
                <Screen name="bar-b" component={TestScreen} options={{ sample3: '3' }} />
              </Group>
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.getCurrentOptions()).toEqual({
    sample: '1',
    sample2: '2',
  });

  act(() => navigation.navigate('bar-b'));

  expect(navigation.getCurrentOptions()).toEqual({
    sample2: '2',
    sample3: '3',
    sample4: '4',
  });
});

test("returns focused screen's options with getCurrentOptions when all screens are rendered", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen name="bar-a" component={TestScreen} options={{ sample: '1' }} />
              <Screen name="bar-b" component={TestScreen} options={{ sample2: '2' }} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.getCurrentOptions()).toEqual({
    sample: '1',
  });

  act(() => navigation.navigate('bar-b'));

  expect(navigation.getCurrentOptions()).toEqual({
    sample2: '2',
  });
});

test("returns focused screen's options with getCurrentOptions when all screens are rendered with screenOptions", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a" screenOptions={() => ({ sample2: '2' })}>
              <Screen name="bar-a" component={TestScreen} options={{ sample: '1' }} />
              <Screen name="bar-b" component={TestScreen} options={{ sample3: '3' }} />
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.getCurrentOptions()).toEqual({
    sample: '1',
    sample2: '2',
  });

  act(() => navigation.navigate('bar-b'));

  expect(navigation.getCurrentOptions()).toEqual({
    sample2: '2',
    sample3: '3',
  });
});

test("returns focused screen's options with getCurrentOptions when all screens are rendered with Group", () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a" screenOptions={() => ({ sample2: '2' })}>
              <Screen name="bar-a" component={TestScreen} options={{ sample: '1' }} />
              <Group screenOptions={{ sample4: '4' }}>
                <Screen name="bar-b" component={TestScreen} options={{ sample3: '3' }} />
              </Group>
            </TestNavigator>
          )}
        </Screen>
        <Screen name="xux" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.getCurrentOptions()).toEqual({
    sample: '1',
    sample2: '2',
  });

  act(() => navigation.navigate('bar-b'));

  expect(navigation.getCurrentOptions()).toEqual({
    sample2: '2',
    sample3: '3',
    sample4: '4',
  });
});

test('does not throw if while getting current options with no options defined', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
    );
  };

  const TestScreen = () => null;

  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="bar" options={{ a: 'b' }}>
          {() => (
            <TestNavigator initialRouteName="bar-a">
              <Screen name="bar-b" component={TestScreen} options={{ wrongKey: true }} />
              <Screen name="bar-a" component={TestScreen} />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(container).update(container);

  expect(navigation.getCurrentOptions()).toEqual({});
});

test('does not throw if while getting current options with empty container', () => {
  const navigation = createNavigationContainerRef<ParamListBase>();

  const container = <BaseNavigationContainer ref={navigation}>{null}</BaseNavigationContainer>;

  render(container).update(container);

  expect(navigation.getCurrentOptions()).toBeUndefined();
});
