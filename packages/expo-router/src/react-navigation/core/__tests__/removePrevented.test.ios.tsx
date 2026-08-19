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
  const beforeRemove = jest.fn();
  let setPreventRemove: React.Dispatch<React.SetStateAction<boolean>>;

  const TestScreen = ({ navigation }: any) => {
    const [preventRemove, setPreventRemoveState] = React.useState(true);
    setPreventRemove = setPreventRemoveState;
    usePreventRemove(preventRemove, removePrevented);
    React.useEffect(() => navigation.addListener('removePrevented', removePrevented), [navigation]);
    React.useEffect(
      () =>
        navigation.addListener('beforeRemove', (event: any) => {
          beforeRemove(event);
          event.preventDefault();
        }),
      [navigation]
    );
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
  expect(beforeRemove).not.toHaveBeenCalled();

  act(() => setPreventRemove(false));
  expect(() => act(() => ref.current?.dispatchSync(CommonActions.goBack()))).toThrow(
    '`beforeRemove` is a notification-only event and cannot prevent screen removal. Use `usePreventRemove` with the `removePrevented` event instead.'
  );

  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo', 'bar']);
  expect(beforeRemove).toHaveBeenCalledTimes(1);
  expect(beforeRemove.mock.calls[0][0].defaultPrevented).toBe(false);
});

test('blocks synchronous redispatch from removePrevented without re-emitting', () => {
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
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const TestScreen = () => {
    usePreventRemove(true, removePrevented);
    return null;
  };

  try {
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
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "The action 'GO_BACK' was dispatched from inside a `usePreventRemove` callback and was prevented again. The `removePrevented` event was not re-emitted to avoid an infinite loop. There is no way to dispatch directly from the callback; set `preventRemove` to `false` first, then retry (for example, call `router.back()` from the handler or dispatch the captured action from an effect)."
    );
  } finally {
    warn.mockRestore();
  }
});

test('emits beforeRemove in a nested navigator when its parent route is removed', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const beforeRemove = jest.fn();

  const NestedScreen = ({ navigation }: any) => {
    React.useEffect(() => navigation.addListener('beforeRemove', beforeRemove), [navigation]);
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
  act(() => ref.current?.goBack());

  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo']);
  expect(beforeRemove).toHaveBeenCalledTimes(1);
});
