import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';

import { NavigationContainer } from '../../../fork/NavigationContainer';
import { createNavigationContainerRef, NavigationRouteContext, useNavigation } from '../../core';
import type { StackNavigationProp } from '../../stack';
import { createStackNavigator } from '../__stubs__/createStackNavigator';
import { useRoutePath } from '../useRoutePath';

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

const Test = () => {
  const route = React.useContext(NavigationRouteContext);
  const path = useRoutePath();

  return `${route?.name}: ${path}`;
};

test('throws when not rendered inside a screen', () => {
  expect(() => {
    render(
      <NavigationContainer linking={config}>
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
    <NavigationContainer ref={navigation} linking={config}>
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
      linking={config}
      initialState={{
        routes: [
          {
            name: 'a',
            state: { routes: [{ name: 'b', params: { id: 'apple' } }] },
          },
        ],
      }}>
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
