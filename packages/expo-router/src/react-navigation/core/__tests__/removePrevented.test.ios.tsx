import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { RouterRegistryProvider } from '../../../global-state/routerRegistry';
import { CommonActions, type ParamListBase, StackActions, StackRouter } from '../../routers';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { usePreventRemove } from '../usePreventRemove';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';

jest.mock('nanoid/non-secure', () => {
  const m = { nanoid: () => String(++m.__key), __key: 0 };
  return m;
});

beforeEach(() => {
  require('nanoid/non-secure').__key = 0;
});

test('blocks removal with the hook and emits removePrevented', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const removePrevented = jest.fn();
  const removed = jest.fn();
  const explicitlyUnsubscribedRemoved = jest.fn();
  let setPreventRemove: React.Dispatch<React.SetStateAction<boolean>>;
  let unsubscribeRemoved: () => void;

  const TestScreen = ({ navigation }: any) => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    setPreventRemove = setPreventRemoveState;
    usePreventRemove(preventRemove, removePrevented);
    React.useEffect(() => navigation.addListener('removePrevented', removePrevented), [navigation]);
    React.useEffect(() => {
      const unsubscribe = navigation.addListener('removed', removed);
      return () => queueMicrotask(unsubscribe);
    }, [navigation]);
    React.useEffect(() => {
      unsubscribeRemoved = navigation.addListener('removed', explicitlyUnsubscribedRemoved);
      return () => queueMicrotask(unsubscribeRemoved);
    }, [navigation]);
    return null;
  };

  const ref = createNavigationContainerRef<ParamListBase>();
  render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => ref.current?.navigate('bar'));
  const action = StackActions.pop();
  act(() => ref.current?.dispatch(action));

  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo', 'bar']);
  expect(removePrevented).toHaveBeenCalledTimes(2);
  expect(removePrevented.mock.calls[0][0].data.action).toBe(action);
  expect(removePrevented.mock.calls[1][0].data.action).toBe(action);
  expect(removed).not.toHaveBeenCalled();

  act(() => unsubscribeRemoved());
  act(() => setPreventRemove(false));
  act(() => ref.current?.dispatchSync(CommonActions.goBack()));

  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo']);
  expect(removed).toHaveBeenCalledTimes(1);
  expect(explicitlyUnsubscribedRemoved).not.toHaveBeenCalled();
});

// TODO(@ubax): prevent synchronous redispatch from a `removePrevented` callback.
test.skip('blocks synchronous redispatch from removePrevented without re-emitting', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const ref = createNavigationContainerRef<ParamListBase>();
  const removePrevented = jest.fn(({ data }) => ref.current?.dispatchSync(data.action));

  const TestScreen = () => {
    usePreventRemove(true, removePrevented);
    return null;
  };

  render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>,
    { wrapper: RouterRegistryProvider }
  );

  act(() => ref.current?.navigate('bar'));
  act(() => ref.current?.dispatchSync(CommonActions.goBack()));

  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo', 'bar']);
  expect(removePrevented).toHaveBeenCalledTimes(1);
});

test('emits removed in a nested navigator when its parent route is removed', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const removed = jest.fn();

  const NestedScreen = ({ navigation }: any) => {
    React.useEffect(() => {
      const unsubscribe = navigation.addListener('removed', removed);
      return () => queueMicrotask(unsubscribe);
    }, [navigation]);
    return null;
  };

  const NestedNavigator = () => (
    <TestNavigator>
      <Screen name="nested" component={NestedScreen} />
    </TestNavigator>
  );

  const ref = createNavigationContainerRef<ParamListBase>();
  render(
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        type: 'stack',
        index: 0,
        routeNames: ['foo', 'bar'],
        routes: [
          { name: 'foo' },
          { name: 'bar', state: { type: 'stack', routes: [{ name: 'nested' }] } },
        ],
      }}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={NestedNavigator} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => ref.current?.navigate('bar'));
  const action = CommonActions.goBack();
  act(() => ref.current?.dispatch(action));

  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo']);
  expect(removed).toHaveBeenCalledTimes(1);
  expect(removed.mock.calls[0][0].data.action).toBe(action);
});
