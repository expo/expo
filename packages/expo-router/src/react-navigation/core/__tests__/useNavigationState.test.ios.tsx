import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import type { NavigationState } from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { useNavigationState } from '../useNavigationState';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('gets the current navigation state', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const callback = jest.fn();

  const Test = () => {
    const state = useNavigationState((state) => state);

    callback(state);

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="first" component={Test} />
        <Screen name="second">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback.mock.calls[0][0].index).toBe(0);

  act(() => navigation.current.navigate('second'));

  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback.mock.calls[1][0].index).toBe(1);

  act(() => navigation.current.navigate('third'));

  expect(callback).toHaveBeenCalledTimes(3);
  expect(callback.mock.calls[2][0].index).toBe(2);

  act(() => navigation.current.navigate('second', { answer: 42 }));

  expect(callback).toHaveBeenCalledTimes(4);
  expect(callback.mock.calls[3][0].index).toBe(1);
  expect(callback.mock.calls[3][0].routes[1].params).toEqual({ answer: 42 });
});

test('gets the current navigation state with selector', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const callback = jest.fn();

  const Test = () => {
    const index = useNavigationState((state) => state.index);

    callback(index);

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator>
        <Screen name="first" component={Test} />
        <Screen name="second">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  render(element);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback.mock.calls[0][0]).toBe(0);

  act(() => navigation.current.navigate('second'));

  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback.mock.calls[1][0]).toBe(1);

  act(() => navigation.current.navigate('third'));

  expect(callback).toHaveBeenCalledTimes(3);
  expect(callback.mock.calls[1][0]).toBe(1);

  act(() => navigation.current.navigate('second'));

  expect(callback).toHaveBeenCalledTimes(4);
  expect(callback.mock.calls[3][0]).toBe(1);
});

test('gets the correct value if selector changes', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const callback = jest.fn();

  const SelectorContext = React.createContext<any>(null);

  const Test = () => {
    const selector = React.useContext(SelectorContext);
    const result = useNavigationState(selector);

    callback(result);

    return null;
  };

  const navigation = React.createRef<any>();

  const App = ({ selector }: { selector: (state: NavigationState) => any }) => {
    return (
      <SelectorContext.Provider value={selector}>
        <BaseNavigationContainer ref={navigation}>
          <TestNavigator>
            <Screen name="first" component={Test} />
            <Screen name="second">{() => null}</Screen>
            <Screen name="third">{() => null}</Screen>
          </TestNavigator>
        </BaseNavigationContainer>
      </SelectorContext.Provider>
    );
  };

  const root = render(<App selector={(state) => state.index} />);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback.mock.calls[0][0]).toBe(0);

  root.update(<App selector={(state) => state.routes[state.index].name} />);

  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback.mock.calls[1][0]).toBe('first');
});

test('gets the current navigation state at navigator level', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key].render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const index = useNavigationState((state) => state.index);
    const routes = useNavigationState((state) => state.routes);

    return JSON.stringify({ index, routes }, null, 2);
  };

  const navigation = React.createRef<any>();

  const root = render(
    <BaseNavigationContainer ref={navigation}>
      <TestNavigator layout={() => <Test />}>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second">{() => null}</Screen>
        <Screen name="third">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`
"{
  "index": 0,
  "routes": [
    {
      "name": "first",
      "key": "first"
    },
    {
      "name": "second",
      "key": "second"
    },
    {
      "name": "third",
      "key": "third"
    }
  ]
}"
`);

  act(() => navigation.current.navigate('second'));

  expect(root).toMatchInlineSnapshot(`
"{
  "index": 1,
  "routes": [
    {
      "name": "first",
      "key": "first"
    },
    {
      "name": "second",
      "key": "second"
    },
    {
      "name": "third",
      "key": "third"
    }
  ]
}"
`);

  act(() => navigation.current.navigate('third'));

  expect(root).toMatchInlineSnapshot(`
"{
  "index": 2,
  "routes": [
    {
      "name": "first",
      "key": "first"
    },
    {
      "name": "second",
      "key": "second"
    },
    {
      "name": "third",
      "key": "third"
    }
  ]
}"
`);

  act(() => navigation.current.navigate('second'));

  expect(root).toMatchInlineSnapshot(`
"{
  "index": 1,
  "routes": [
    {
      "name": "first",
      "key": "first"
    },
    {
      "name": "second",
      "key": "second"
    },
    {
      "name": "third",
      "key": "third"
    }
  ]
}"
`);
});
