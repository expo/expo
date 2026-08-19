import 'react-native-gesture-handler/jestSetup';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';
import { Button, View } from 'react-native';

import { NavigationContainer } from '../../core/__tests__/__fixtures__/NavigationContainer';
import { Text } from '../../elements';
import {
  createNavigationContainerRef,
  type NavigationState,
  useFocusEffect,
  useIsFocused,
} from '../../native';
import { createStackNavigator, type StackScreenProps } from '../index';

type StackParamList = {
  A: undefined;
  B: undefined;
};

type NestedStackParamList = {
  C: undefined;
};

const initialState = {
  stale: false,
  key: 'root',
  index: 0,
  routeNames: ['A', 'B'],
  routes: [{ key: 'A', name: 'A' }],
} satisfies NavigationState;

const nestedInitialState = {
  ...initialState,
  routes: [
    {
      key: 'A',
      name: 'A',
      state: {
        stale: false,
        key: 'nested-A',
        index: 0,
        routeNames: ['C'],
        routes: [{ key: 'C-A', name: 'C' }],
      },
    },
    {
      key: 'B',
      name: 'B',
      state: {
        stale: false,
        key: 'nested-B',
        index: 0,
        routeNames: ['C'],
        routes: [{ key: 'C-B', name: 'C' }],
      },
    },
  ],
} satisfies NavigationState;

jest.useFakeTimers();

const interactionManagerWarning =
  "InteractionManager has been deprecated and will be removed in a future release. Please refactor long tasks into smaller ones, and  use 'requestIdleCallback' instead.";

let warn: jest.SpiedFunction<typeof console.warn>;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  expect(warn.mock.calls).toEqual(
    warn.mock.calls.filter(([message]) => message === interactionManagerWarning)
  );
  warn.mockRestore();
});

test('renders a stack navigator with screens', async () => {
  const Test = ({ route, navigation }: StackScreenProps<StackParamList>) => (
    <View>
      <Text>Screen {route.name}</Text>
      <Button onPress={() => navigation.navigate('A')} title="Go to A" />
      <Button onPress={() => navigation.navigate('B')} title="Go to B" />
    </View>
  );

  const Stack = createStackNavigator<StackParamList>();

  const { getByText, queryByText } = render(
    <NavigationContainer initialState={initialState}>
      <Stack.Navigator>
        <Stack.Screen name="A" component={Test} />
        <Stack.Screen name="B" component={Test} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Screen A')).not.toBeNull();
  expect(queryByText('Screen B')).toBeNull();

  fireEvent.press(getByText('Go to B'));

  act(() => jest.runAllTimers());

  expect(queryByText('Screen B')).not.toBeNull();
});

test("doesn't show back button on the first screen", async () => {
  const Test = ({ navigation }: StackScreenProps<StackParamList>) => (
    <Button onPress={() => navigation.navigate('B')} title="Go to B" />
  );

  const Stack = createStackNavigator<StackParamList>();

  const { getByText, queryByRole } = render(
    <NavigationContainer initialState={initialState}>
      <Stack.Navigator>
        <Stack.Screen name="A" component={Test} />
        <Stack.Screen name="B" component={Test} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(queryByRole('button', { name: 'Go back' })).toBeNull();

  fireEvent.press(getByText('Go to B'));

  expect(queryByRole('button', { name: 'A, back' })).not.toBeNull();
});

test('fires transition events on navigation', async () => {
  const FirstScreen = ({ navigation }: StackScreenProps<StackParamList>) => (
    <Button onPress={() => navigation.navigate('B')} title="Go to B" />
  );

  const onTransitionStart = jest.fn();
  const onTransitionEnd = jest.fn();

  const SecondScreen = ({ navigation }: StackScreenProps<StackParamList>) => {
    React.useLayoutEffect(
      () => navigation.addListener('transitionStart', onTransitionStart),
      [navigation]
    );

    React.useEffect(() => navigation.addListener('transitionEnd', onTransitionEnd), [navigation]);

    return <Button onPress={() => navigation.goBack()} title="Go back" />;
  };

  const Stack = createStackNavigator<StackParamList>();

  const { getByText } = render(
    <NavigationContainer initialState={initialState}>
      <Stack.Navigator>
        <Stack.Screen name="A" component={FirstScreen} />
        <Stack.Screen name="B" component={SecondScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(onTransitionStart).not.toHaveBeenCalled();
  expect(onTransitionEnd).not.toHaveBeenCalled();

  fireEvent.press(getByText('Go to B'));

  act(() => jest.advanceTimersByTime(1));

  expect(onTransitionStart).toHaveBeenCalledTimes(1);
  expect(onTransitionStart).toHaveBeenCalledWith(
    expect.objectContaining({ data: { closing: false } })
  );

  expect(onTransitionEnd).not.toHaveBeenCalled();

  act(() => jest.runAllTimers());

  expect(onTransitionStart).toHaveBeenCalledTimes(1);
  expect(onTransitionEnd).toHaveBeenCalledTimes(1);
  expect(onTransitionEnd).toHaveBeenCalledWith(
    expect.objectContaining({ data: { closing: false } })
  );

  fireEvent.press(getByText('Go back'));

  expect(onTransitionStart).toHaveBeenCalledTimes(2);
  expect(onTransitionStart).toHaveBeenCalledWith(
    expect.objectContaining({ data: { closing: true } })
  );

  expect(onTransitionEnd).toHaveBeenCalledTimes(1);

  act(() => jest.runAllTimers());

  expect(onTransitionEnd).toHaveBeenCalledTimes(2);
  expect(onTransitionEnd).toHaveBeenCalledWith(
    expect.objectContaining({ data: { closing: true } })
  );
});

test('handles screens preloading', async () => {
  const Stack = createStackNavigator<StackParamList>();

  const navigation = createNavigationContainerRef<StackParamList>();

  const { queryByText } = render(
    <NavigationContainer ref={navigation} initialState={initialState}>
      <Stack.Navigator>
        <Stack.Screen name="A">{() => null}</Stack.Screen>
        <Stack.Screen name="B">{() => <Text>Screen B</Text>}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Screen B', { includeHiddenElements: true })).toBeNull();
  act(() => navigation.preload('B'));
  expect(queryByText('Screen B', { includeHiddenElements: true })).not.toBeNull();
});

test('runs focus effect on focus change on preloaded route', () => {
  const focusEffect = jest.fn();
  const focusEffectCleanup = jest.fn();

  const Test = () => {
    const onFocus = React.useCallback(() => {
      focusEffect();

      return focusEffectCleanup;
    }, []);

    useFocusEffect(onFocus);

    return null;
  };

  const Stack = createStackNavigator<StackParamList>();

  const navigation = createNavigationContainerRef<StackParamList>();

  render(
    <NavigationContainer ref={navigation} initialState={initialState}>
      <Stack.Navigator>
        <Stack.Screen name="A">{() => null}</Stack.Screen>
        <Stack.Screen name="B" component={Test} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(focusEffect).not.toHaveBeenCalled();
  expect(focusEffectCleanup).not.toHaveBeenCalled();

  act(() => navigation.preload('A'));
  act(() => navigation.preload('B'));

  expect(focusEffect).not.toHaveBeenCalled();
  expect(focusEffectCleanup).not.toHaveBeenCalled();

  act(() => navigation.navigate('B'));

  expect(focusEffect).toHaveBeenCalledTimes(1);
  expect(focusEffectCleanup).not.toHaveBeenCalled();

  act(() => navigation.navigate('A'));

  expect(focusEffect).toHaveBeenCalledTimes(1);
  expect(focusEffectCleanup).toHaveBeenCalledTimes(1);
});

test('renders correct focus state with preloading', () => {
  const Test = () => {
    const isFocused = useIsFocused();

    return (
      <>
        <Text>Test Screen</Text>
        <Text>{isFocused ? 'focused' : 'unfocused'}</Text>
      </>
    );
  };

  const Stack = createStackNavigator<StackParamList>();

  const navigation = React.createRef<any>();

  const { queryByText } = render(
    <NavigationContainer ref={navigation} initialState={initialState}>
      <Stack.Navigator>
        <Stack.Screen name="A">{() => null}</Stack.Screen>
        <Stack.Screen name="B" component={Test} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Test Screen', { includeHiddenElements: true })).toBeNull();

  act(() => navigation.current.preload('B'));

  expect(queryByText('Test Screen', { includeHiddenElements: true })).not.toBeNull();

  expect(queryByText('unfocused', { includeHiddenElements: true })).not.toBeNull();

  act(() => navigation.current.navigate('B'));

  expect(queryByText('focused', { includeHiddenElements: true })).not.toBeNull();

  act(() => navigation.current.navigate('A'));

  expect(queryByText('focused', { includeHiddenElements: true })).toBeNull();
});

test('renders back button in the nested stack', async () => {
  const StackA = createStackNavigator<NestedStackParamList>();

  const StackAScreen = ({ route }: StackScreenProps<StackParamList>) => (
    <StackA.Navigator>
      <StackA.Screen name="C">
        {({ navigation }) => {
          const next = route.name === 'A' ? 'B' : 'A';

          return <Button onPress={() => navigation.navigate(next)} title={`Go to ${next}`} />;
        }}
      </StackA.Screen>
    </StackA.Navigator>
  );

  const StackB = createStackNavigator<StackParamList>();

  const { getByText, queryByRole } = render(
    <NavigationContainer initialState={nestedInitialState}>
      <StackB.Navigator screenOptions={{ headerShown: false }}>
        <StackB.Screen name="A" component={StackAScreen} />
        <StackB.Screen name="B" component={StackAScreen} />
      </StackB.Navigator>
    </NavigationContainer>
  );

  expect(queryByRole('button', { name: 'Go back' })).toBeNull();
  expect(getByText('Go to B')).not.toBeNull();

  act(() => {
    fireEvent.press(getByText('Go to B'));
  });

  expect(queryByRole('button', { name: 'A, back' })).not.toBeNull();
});
