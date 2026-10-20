import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  type EmitterSubscription,
  Keyboard,
  type KeyboardEventListener,
  type KeyboardEventName,
  Platform,
  View,
} from 'react-native';

import { NavigationContainer } from '../../../fork/NavigationContainer';
import { Tabs } from '../../../layouts/Tabs';
import { renderRouter, screen } from '../../../testing-library';
import { Text } from '../../elements';
import { createNavigationContainerRef } from '../../native';
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

// Mirrors the activity states `BottomTabView` hands to `MaybeScreen`.
const STATE_INACTIVE = 0;
const STATE_TRANSITIONING_OR_BELOW_TOP = 1;
const STATE_ON_TOP = 2;

/** Reads the activity state of the screen container wrapping `text`. */
function getActivityState(text: string) {
  let node = screen.getByText(text, { includeHiddenElements: true }).parent;

  while (node && node.props.activityState === undefined) {
    node = node.parent;
  }

  return node?.props.activityState;
}

test('keeps the outgoing tab attached until its transition has settled', async () => {
  await renderRouter({
    _layout: () => (
      <Tabs screenOptions={{ animation: 'fade' }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  expect(getActivityState('Screen index')).toBe(STATE_ON_TOP);

  await fireEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  // The outgoing screen has to stay attached for the whole transition, otherwise
  // it is detached mid-animation and the arriving tab renders blank.
  expect(getActivityState('Screen index')).toBe(STATE_TRANSITIONING_OR_BELOW_TOP);
  expect(getActivityState('Screen second')).toBe(STATE_ON_TOP);

  // Once the animation finishes, the delayed clear detaches it.
  await act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(getActivityState('Screen index')).toBe(STATE_INACTIVE);
  expect(getActivityState('Screen second')).toBe(STATE_ON_TOP);
});

test('detaches the outgoing tab immediately when the transition is not animated', async () => {
  await renderRouter({
    _layout: () => (
      <Tabs screenOptions={{ animation: 'none' }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  await fireEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(getActivityState('Screen index')).toBe(STATE_INACTIVE);
  expect(getActivityState('Screen second')).toBe(STATE_ON_TOP);
});
