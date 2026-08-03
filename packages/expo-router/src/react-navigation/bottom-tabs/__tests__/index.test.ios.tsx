import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import * as React from 'react';
import {
  type EmitterSubscription,
  Keyboard,
  type KeyboardEventListener,
  type KeyboardEventName,
  Platform,
  View,
} from 'react-native';

import { NavigationContainer } from '../../../fork/NavigationContainer';
import { Text } from '../../elements';
import { createNavigationContainerRef } from '../../native';
import { createStackNavigator } from '../../stack';
import { type BottomTabScreenProps, createBottomTabNavigator } from '../index';

type BottomTabParamList = {
  A: undefined;
  B: undefined;
};

jest.useFakeTimers();

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders a bottom tab navigator with screens', async () => {
  const Test = ({ route }: BottomTabScreenProps<BottomTabParamList>) => (
    <View>
      <Text>Screen {route.name}</Text>
    </View>
  );

  const Tab = createBottomTabNavigator<BottomTabParamList>();

  const { queryByText, getAllByRole, getByRole } = render(
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="A" component={Test} />
        <Tab.Screen name="B" component={Test} />
      </Tab.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Screen A')).not.toBeNull();
  expect(queryByText('Screen B')).toBeNull();

  expect(getAllByRole('button', { name: /(A|B), tab, (1|2) of 2/ })).toHaveLength(2);

  fireEvent.press(getByRole('button', { name: 'B, tab, 2 of 2' }), {});

  expect(queryByText('Screen B')).not.toBeNull();
});

test('handles screens preloading', async () => {
  const Tab = createBottomTabNavigator<BottomTabParamList>();

  const navigation = createNavigationContainerRef<BottomTabParamList>();

  const { queryByText } = render(
    <NavigationContainer ref={navigation}>
      <Tab.Navigator>
        <Tab.Screen name="A">{() => null}</Tab.Screen>
        <Tab.Screen name="B">{() => <Text>Screen B</Text>}</Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Screen B', { includeHiddenElements: true })).toBeNull();
  act(() => navigation.preload('B'));
  expect(queryByText('Screen B', { includeHiddenElements: true })).not.toBeNull();
});

test('tab bar cannot be tapped when hidden', async () => {
  // @ts-expect-error: mock implementation for testing
  const listeners: Record<KeyboardEventName, KeyboardEventListener[]> = {
    keyboardWillShow: [],
    keyboardWillHide: [],
  };

  const spy = jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
    listeners[name].push(callback);

    return {
      remove: () => {
        listeners[name] = listeners[name].filter((c) => c !== callback);
      },
    } as EmitterSubscription;
  });

  const Test = ({ route }: BottomTabScreenProps<BottomTabParamList>) => (
    <View>
      <Text>Screen {route.name}</Text>
    </View>
  );

  const Tab = createBottomTabNavigator<BottomTabParamList>();

  const { queryByText, getByRole } = render(
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarHideOnKeyboard: true,
        }}>
        <Tab.Screen name="A" component={Test} />
        <Tab.Screen name="B" component={Test} />
      </Tab.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Screen B')).toBeNull();

  fireEvent.press(getByRole('button', { name: 'B, tab, 2 of 2' }), {});

  act(() => jest.runAllTimers());

  expect(queryByText('Screen B')).not.toBeNull();

  act(() => {
    // Show the keyboard to hide the tab bar
    listeners.keyboardWillShow.forEach((listener) =>
      // @ts-expect-error: mock event
      listener({})
    );
  });

  fireEvent.press(getByRole('button', { name: 'A, tab, 1 of 2' }), {});

  act(() => jest.runAllTimers());

  expect(queryByText('Screen A')).toBeNull();
  expect(queryByText('Screen B')).not.toBeNull();

  spy.mockRestore();
});

test('keeps the params and does not remount the tab on re-press with getId', async () => {
  type ParamList = {
    A: undefined;
    B: { user: string } | undefined;
  };

  const Tab = createBottomTabNavigator<ParamList>();
  const navigation = createNavigationContainerRef<ParamList>();
  const onMountB = jest.fn();

  const B = ({ route }: BottomTabScreenProps<ParamList, 'B'>) => {
    React.useEffect(() => {
      onMountB();
    }, []);
    return <Text>B user: {route.params?.user ?? 'none'}</Text>;
  };

  const { queryByText, getByRole } = render(
    <NavigationContainer ref={navigation}>
      <Tab.Navigator>
        <Tab.Screen name="A">{() => <Text>Screen A</Text>}</Tab.Screen>
        <Tab.Screen name="B" component={B} getId={({ params }) => params?.user} />
      </Tab.Navigator>
    </NavigationContainer>
  );

  act(() => navigation.navigate('B', { user: 'jane' }));

  expect(queryByText('B user: jane')).not.toBeNull();
  expect(onMountB).toHaveBeenCalledTimes(1);

  await userEvent.press(getByRole('button', { name: 'A, tab, 1 of 2' }));
  await userEvent.press(getByRole('button', { name: 'B, tab, 2 of 2' }));

  expect(queryByText('B user: jane')).not.toBeNull();
  expect(onMountB).toHaveBeenCalledTimes(1);
});

test('resets a nested stack when its tab loses focus with popToTopOnBlur', async () => {
  const Tab = createBottomTabNavigator<BottomTabParamList>();
  const Stack = createStackNavigator<{ Home: undefined; Details: undefined }>();
  const navigation = createNavigationContainerRef<BottomTabParamList>();

  const StackA = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">{() => <Text>Home</Text>}</Stack.Screen>
      <Stack.Screen name="Details">{() => <Text>Details</Text>}</Stack.Screen>
    </Stack.Navigator>
  );

  const { queryByText, getByRole } = render(
    <NavigationContainer ref={navigation}>
      <Tab.Navigator>
        <Tab.Screen name="A" component={StackA} options={{ popToTopOnBlur: true }} />
        <Tab.Screen name="B">{() => <Text>Screen B</Text>}</Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );

  act(() => navigation.navigate('A', { screen: 'Details' } as never));
  act(() => jest.runAllTimers());

  expect(queryByText('Details')).not.toBeNull();

  await userEvent.press(getByRole('button', { name: 'B, tab, 2 of 2' }));
  act(() => jest.runAllTimers());

  await userEvent.press(getByRole('button', { name: 'A, tab, 1 of 2' }));
  act(() => jest.runAllTimers());

  // Without `popToTopOnBlur`, the details screen would still be active.
  expect(queryByText('Home')).not.toBeNull();
  expect(queryByText('Details')).toBeNull();
});

test('tab bars render appropriate hrefs on web', () => {
  jest.replaceProperty(Platform, 'OS', 'web');

  const Tab = createBottomTabNavigator<BottomTabParamList>();

  const { getByText } = render(
    <NavigationContainer
      linking={{
        prefixes: [],
        config: {
          path: 'root',
          screens: {
            A: 'first',
            B: 'second',
          },
        },
        getInitialURL: () => null,
      }}>
      <Tab.Navigator screenOptions={{ tabBarButton: ({ href }) => <Text>{href}</Text> }}>
        <Tab.Screen name="A">{() => null}</Tab.Screen>
        <Tab.Screen name="B">{() => null}</Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );

  expect(getByText('/root/first')).not.toBeNull();
  expect(getByText('/root/second')).not.toBeNull();
});
