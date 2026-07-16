import { act, render } from '@testing-library/react-native';

import { type ParamListBase, StackActions, StackRouter } from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { getRouteKey, getStateKey } from '../../routers/getRouteKey';
import { usePreventRemove } from '../usePreventRemove';
import { MockRouterKey } from './__fixtures__/MockRouter';

// Deterministic structural keys for the root stack (`foo`/`bar`/`baz`).
const rootKey = getStateKey(undefined);
const fooKey = getRouteKey({ stateKey: rootKey, name: 'foo' });
const barKey = getRouteKey({ stateKey: rootKey, name: 'bar' });
const bazKey = getRouteKey({ stateKey: rootKey, name: 'baz' });

jest.mock('nanoid/non-secure', () => {
  const m = { nanoid: () => String(++m.__key), __key: 0 };

  return m;
});

beforeEach(() => {
  MockRouterKey.current = 0;

  require('nanoid/non-secure').__key = 0;
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

  let shouldContinue = false;

  const TestScreen = (props: any) => {
    usePreventRemove(true, ({ data }) => {
      onPreventRemove();
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
      onStateChange={onStateChange}
      initialState={{
        stale: false as const,
        index: 0,
        key: rootKey,
        routeNames: ['foo', 'bar', 'baz'],
        routes: [{ key: fooKey, name: 'foo' }],
      }}>
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
      { key: bazKey, name: 'baz' },
    ],
    stale: false,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

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

  shouldContinue = true;

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(4);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });
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

  let shouldContinue = false;

  const TestScreen = (props: any) => {
    usePreventRemove(false, () => {});
    usePreventRemove(true, ({ data }) => {
      onPreventRemove();
      if (shouldContinue) {
        props.navigation.dispatch(data.action);
      }
    });
    usePreventRemove(false, () => {});

    return null;
  };

  const onStateChange = jest.fn();

  const ref = createNavigationContainerRef<ParamListBase>();

  const element = (
    <BaseNavigationContainer
      ref={ref}
      onStateChange={onStateChange}
      initialState={{
        stale: false as const,
        index: 0,
        key: rootKey,
        routeNames: ['foo', 'bar', 'baz'],
        routes: [{ key: fooKey, name: 'foo' }],
      }}>
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
      { key: bazKey, name: 'baz' },
    ],
    stale: false,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(2);
  expect(onPreventRemove).toHaveBeenCalledTimes(1);

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

  shouldContinue = true;

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(4);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
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
    <BaseNavigationContainer
      ref={ref}
      onStateChange={onStateChange}
      initialState={{
        stale: false as const,
        index: 0,
        key: rootKey,
        routeNames: ['foo', 'bar', 'baz'],
        routes: [{ key: fooKey, name: 'foo' }],
      }}>
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
      { key: bazKey, name: 'baz' },
    ],
    stale: false,
  });

  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(3);

  expect(ref.current?.getRootState()).toEqual({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.dispatch(StackActions.popTo('foo')));

  expect(onStateChange).toHaveBeenCalledTimes(5);
  expect(onStateChange).toHaveBeenCalledWith({
    index: 0,
    key: rootKey,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: fooKey, name: 'foo' }],
    stale: false,
  });

  expect(onPreventRemove).toHaveBeenCalledTimes(0);
});
