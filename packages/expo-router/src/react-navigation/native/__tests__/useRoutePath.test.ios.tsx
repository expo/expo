import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';

import {
  createNavigationContainerRef,
  NavigationRouteContext,
  type NavigationState,
  useNavigation,
} from '../../core';
import { NavigationContainer } from '../../core/__tests__/__fixtures__/NavigationContainer';
import type { StackNavigationProp } from '../../stack';
import { createStackNavigator } from '../__stubs__/createStackNavigator';
import { useRoutePath } from '../useRoutePath';

const initialState = {
  stale: false,
  routeKeySeq: 0,
  key: 'root',
  index: 0,
  routeNames: ['a', 'b'],
  routes: [{ key: 'a', name: 'a' }],
} satisfies NavigationState;

const config = {
  prefixes: ['https://example.com'],
  config: {
    screens: {
      a: {
        path: 'foo',
        screens: {
          b: 'bar/:id',
          c: {
            path: 'baz',
            exact: true,
          },
        },
      },
      b: 'qux',
    },
  },
  getInitialURL() {
    return null;
  },
};

let warn: jest.SpiedFunction<typeof console.warn>;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

const Test = () => {
  const route = React.useContext(NavigationRouteContext);
  const path = useRoutePath();

  return `${route?.name}: ${path}`;
};

test('throws when not rendered inside a screen', () => {
  expect(() => {
    render(
      <NavigationContainer initialState={initialState} linking={config}>
        <Test />
      </NavigationContainer>
    );
  }).toThrow(
    "Couldn't find a state for the route object. Is your component inside a screen in a navigator?"
  );
});

test('gets path for route in root navigator screen', () => {
  type RootStackParamList = {
    a: undefined;
    b: { count: number };
  };

  const Stack = createStackNavigator<RootStackParamList>();

  const navigation = createNavigationContainerRef<RootStackParamList>();

  render(
    <NavigationContainer ref={navigation} initialState={initialState} linking={config}>
      <Stack.Navigator>
        <Stack.Screen name="a" component={Test} />
        <Stack.Screen name="b" component={Test} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(screen).toMatchInlineSnapshot(`"a: /foo"`);

  act(() => navigation.navigate('b', { count: 42 }));

  expect(screen).toMatchInlineSnapshot(`"b: /qux?count=42"`);
});

test('gets path for route in nested navigator screen', () => {
  type AStackParamList = {
    a: undefined;
  };

  type BStackParamList = {
    b: { id: string };
    c: undefined;
  };

  const StackA = createStackNavigator<AStackParamList>();
  const StackB = createStackNavigator<BStackParamList>();

  const navigation = createNavigationContainerRef<AStackParamList>();
  let navigateToC: () => void;
  const NestedTest = () => {
    const navigation = useNavigation<StackNavigationProp<BStackParamList>>();
    navigateToC = () => navigation.navigate('c');
    return <Test />;
  };

  render(
    <NavigationContainer
      ref={navigation}
      linking={{ ...config, getInitialURL: () => 'https://example.com/foo/bar/apple' }}>
      <StackA.Navigator>
        <StackA.Screen name="a">
          {() => (
            <StackB.Navigator>
              <StackB.Screen name="b" component={NestedTest} />
              <StackB.Screen name="c" component={NestedTest} />
            </StackB.Navigator>
          )}
        </StackA.Screen>
      </StackA.Navigator>
    </NavigationContainer>
  );

  expect(screen).toMatchInlineSnapshot(`"b: /foo/bar/apple"`);

  act(() => navigateToC());

  expect(screen).toMatchInlineSnapshot(`"c: /baz"`);
});
