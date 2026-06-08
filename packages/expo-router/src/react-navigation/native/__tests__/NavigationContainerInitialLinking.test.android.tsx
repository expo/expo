import { afterEach, expect, jest, test } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { NavigationContainer } from '../../../fork/NavigationContainer';
import { createStackNavigator } from '../__stubs__/createStackNavigator';

afterEach(() => {
  jest.restoreAllMocks();
});

test('does not update unhandled linking state during initial render', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  const Stack = createStackNavigator<{ Home: undefined }>();

  const linking = {
    prefixes: ['example://'],
    config: {
      screens: {
        Home: 'home',
      },
    },
    getInitialURL: () => Promise.resolve('example://home'),
  };

  await act(async () => {
    render(
      <NavigationContainer linking={linking}>
        <Stack.Navigator>
          <Stack.Screen name="Home">{() => <Text>Home</Text>}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  });

  expect(consoleError.mock.calls.flat().join("\n")).not.toContain(
    "state update on a component that hasn't mounted"
  );
});
