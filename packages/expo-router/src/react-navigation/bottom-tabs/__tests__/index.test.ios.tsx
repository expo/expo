import { userEvent } from '@testing-library/react-native';
import { useEffect, useState } from 'react';
import {
  type EmitterSubscription,
  Keyboard,
  type KeyboardEventListener,
  type KeyboardEventName,
  Pressable,
  View,
} from 'react-native';

import { router } from '../../../imperative-api';
import { Stack } from '../../../layouts/Stack';
import { Tabs } from '../../../layouts/Tabs';
import { act, renderRouter, screen } from '../../../testing-library';
import { useNavigation } from '../../../useNavigation';
import { Text } from '../../elements';
import type { ParamListBase } from '../../native';
import type { BottomTabBarProps, BottomTabNavigationProp } from '../types';

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  jest.restoreAllMocks();
});

test('renders a bottom tab navigator and navigates between screens on tab press', async () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  expect(screen.queryByText('Screen index')).not.toBeNull();
  expect(screen.queryByText('Screen second')).toBeNull();

  expect(screen.getAllByRole('button', { name: /(index|second), tab, (1|2) of 2/ })).toHaveLength(
    2
  );

  await userEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(screen.queryByText('Screen second')).not.toBeNull();
  expect(screen).toHavePathname('/second');
});

test('an unvisited tab option can navigate with its placeholder navigation', async () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen
          name="second"
          options={({ navigation }) => ({
            tabBarButton: ({ children }) => (
              <Pressable testID="second-tab" onPress={() => navigation.navigate('second')}>
                {children}
              </Pressable>
            ),
          })}
        />
      </Tabs>
    ),
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  expect(screen.queryByText('Screen second')).toBeNull();
  await userEvent.press(screen.getByTestId('second-tab'));
  expect(screen).toHavePathname('/second');
  expect(screen.queryByText('Screen second')).not.toBeNull();
});

test('renders tabs in route names order while preserving focus', () => {
  let reverse!: () => void;

  function Layout() {
    const [reversed, setReversed] = useState(false);
    reverse = () => setReversed(true);
    const screens = [
      <Tabs.Screen key="index" name="index" />,
      <Tabs.Screen key="second" name="second" />,
    ];
    return <Tabs>{reversed ? screens.reverse() : screens}</Tabs>;
  }

  renderRouter({
    _layout: Layout,
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  act(() => router.navigate('/second'));
  act(reverse);

  expect(
    screen.getByRole('button', { name: 'second, tab, 1 of 2' }).props.accessibilityState
  ).toEqual({ selected: true });
  expect(
    screen.getByRole('button', { name: 'index, tab, 2 of 2' }).props.accessibilityState
  ).toEqual({
    selected: false,
  });
  expect(screen.queryByText('Screen second')).not.toBeNull();
});

test('handles screens preloading', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => null,
    second: () => <Text>Screen second</Text>,
  });

  expect(screen.queryByText('Screen second', { includeHiddenElements: true })).toBeNull();

  act(() => router.prefetch('/second'));

  expect(screen.queryByText('Screen second', { includeHiddenElements: true })).not.toBeNull();
});

test('preloads a non-lazy screen after mount', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" options={{ lazy: false }} />
      </Tabs>
    ),
    index: () => null,
    second: () => <Text>Screen second</Text>,
  });

  expect(screen.queryByText('Screen second', { includeHiddenElements: true })).not.toBeNull();
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

  renderRouter({
    _layout: () => (
      <Tabs screenOptions={{ tabBarHideOnKeyboard: true }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text>Screen index</Text>,
    second: () => <Text>Screen second</Text>,
  });

  expect(screen.queryByText('Screen second')).toBeNull();

  await userEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(screen.queryByText('Screen second')).not.toBeNull();

  act(() => {
    // Show the keyboard to hide the tab bar
    listeners.keyboardWillShow.forEach((listener) =>
      // @ts-expect-error: mock event
      listener({})
    );
  });

  await userEvent.press(screen.getByRole('button', { name: 'index, tab, 1 of 2' }));

  expect(screen.queryByText('Screen index')).toBeNull();
  expect(screen.queryByText('Screen second')).not.toBeNull();

  spy.mockRestore();
});

test('does not navigate when a tabPress listener prevents the default action', async () => {
  function Second() {
    const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
    useEffect(
      () => navigation.addListener('tabPress', (event) => event.preventDefault()),
      [navigation]
    );
    return <View testID="second" />;
  }

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" options={{ lazy: false }} />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: Second,
  });

  await userEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(screen).toHavePathname('/');
});

test('a focused tabPress listener does not intercept an unvisited tab', async () => {
  function Index() {
    const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
    useEffect(
      () => navigation.addListener('tabPress', (event) => event.preventDefault()),
      [navigation]
    );
    return <View testID="index" />;
  }

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: Index,
    second: () => <View testID="second" />,
  });

  await userEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(screen).toHavePathname('/second');
});

test('an unvisited tabPress listener can prevent navigation', async () => {
  const secondTabPress = jest.fn((event) => event.preventDefault());

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" listeners={{ tabPress: secondTabPress }} />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  await userEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(secondTabPress).toHaveBeenCalledTimes(1);
  expect(screen).toHavePathname('/');
});

test('keeps the search params of a tab when it is re-selected', async () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  act(() => router.navigate('/second?foo=bar'));
  expect(screen).toHaveSearchParams({ foo: 'bar' });

  await userEvent.press(screen.getByRole('button', { name: 'index, tab, 1 of 2' }));
  await userEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(screen).toHaveSearchParams({ foo: 'bar' });
});

test('does not remount a tab when it is re-selected', async () => {
  let mountCount = 0;

  function Second() {
    useEffect(() => {
      mountCount++;
    }, []);
    return <View testID="second" />;
  }

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: Second,
  });

  act(() => router.navigate('/second?foo=bar'));
  expect(mountCount).toBe(1);

  await userEvent.press(screen.getByRole('button', { name: 'index, tab, 1 of 2' }));
  await userEvent.press(screen.getByRole('button', { name: 'second, tab, 2 of 2' }));

  expect(mountCount).toBe(1);
  expect(screen).toHavePathname('/second');
  expect(screen).toHaveSearchParams({ foo: 'bar' });
});

test('keeps the dynamic segment of a tab when it is re-selected', async () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="[id]" />
        </Tabs>
      ),
      index: () => <View testID="index" />,
      '[id]': () => <View testID="id" />,
    },
    { initialUrl: '/abc' }
  );

  await userEvent.press(screen.getByRole('button', { name: 'index, tab, 1 of 2' }));
  await userEvent.press(screen.getByRole('button', { name: '[id], tab, 2 of 2' }));

  expect(screen).toHavePathname('/abc');
});

test('removes and redirects from a tab whose href is null', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" options={{ href: null }} />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.queryByRole('button', { name: /second/ })).toBeNull();
  expect(screen.getByRole('button', { name: 'index, tab, 1 of 1' })).toBeVisible();

  act(() => router.push('/second'));

  expect(screen).toHavePathname('/');
  expect(screen.queryByTestId('second')).toBeNull();
});

test('redirects when the focused tab href becomes null', () => {
  let setHidden!: (hidden: boolean) => void;
  function Layout() {
    const [hidden, set] = useState(false);
    setHidden = set;
    return (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" options={{ href: hidden ? null : '/second' }} />
      </Tabs>
    );
  }

  renderRouter({
    _layout: Layout,
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  act(() => router.push('/second'));
  expect(screen).toHavePathname('/second');

  act(() => setHidden(true));

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('second')).toBeNull();
});

test('renders only screens declared in the layout and redirects from undeclared routes', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.getAllByRole('button', { name: /tab/ })).toHaveLength(1);

  act(() => router.push('/second'));

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeVisible();
});

test('redirects an undeclared route to the configured initial tab', () => {
  renderRouter({
    _layout: {
      unstable_settings: { initialRouteName: 'second' },
      default: () => (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="second" />
        </Tabs>
      ),
    },
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
    undeclared: () => <View testID="undeclared" />,
  });

  act(() => router.push('/undeclared'));

  expect(screen).toHavePathname('/second');
  expect(screen.getByTestId('second')).toBeVisible();
});

test('renders no tab UI when no screens are declared in the layout', () => {
  renderRouter({
    _layout: () => <Tabs />,
    index: () => <View testID="index" />,
  });

  expect(screen.queryByTestId('index')).toBeNull();
  expect(screen.queryAllByRole('button', { name: /tab/ })).toHaveLength(0);
  expect(warnSpy.mock.calls).toMatchSnapshot();
});

test('prefers a protected screen redirect over the tab visibility fallback', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      'tabs/_layout': () => (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Protected guard={false} redirectTo="/login">
            <Tabs.Screen name="secret" />
          </Tabs.Protected>
        </Tabs>
      ),
      'tabs/index': () => <View testID="index" />,
      'tabs/secret': () => <View testID="secret" />,
      login: () => <View testID="login" />,
    },
    { initialUrl: '/tabs/secret' }
  );

  expect(screen).toHavePathname('/login');
  expect(screen.getByTestId('login')).toBeVisible();
});

test('redirects a fully guarded layout without warning that no screens are declared', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      'tabs/_layout': () => (
        <Tabs>
          <Tabs.Protected guard={false} redirectTo="/login">
            <Tabs.Screen name="index" />
            <Tabs.Screen name="second" />
          </Tabs.Protected>
        </Tabs>
      ),
      'tabs/index': () => <View testID="index" />,
      'tabs/second': () => <View testID="second" />,
      login: () => <View testID="login" />,
    },
    { initialUrl: '/tabs/second' }
  );

  expect(screen).toHavePathname('/login');
  expect(screen.getByTestId('login')).toBeVisible();
  expect(warnSpy).not.toHaveBeenCalled();
});

test('throws when a screen uses both href and tabBarButton', () => {
  expect(() =>
    renderRouter({
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="index" options={{ href: '/index', tabBarButton: () => null }} />
        </Tabs>
      ),
      index: () => null,
    })
  ).toThrow('Cannot use `href` and `tabBarButton` together.');
});

test('renders a custom tabBar and lets it emit and navigate', async () => {
  function CustomTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
    return (
      <View testID="custom-tab-bar">
        {state.routes.map((route) => (
          <Text
            key={route.name}
            testID={`tab-${route.name}`}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigateToTab(route.key);
              }
            }}>
            {descriptors[route.key]!.options.title ?? route.name}
          </Text>
        ))}
      </View>
    );
  }

  renderRouter({
    _layout: () => (
      <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" options={{ title: 'Second' }} />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.getByTestId('custom-tab-bar')).toBeVisible();
  expect(screen.getByTestId('tab-second')).toHaveTextContent('Second');

  await userEvent.press(screen.getByTestId('tab-second'));

  expect(screen).toHavePathname('/second');
});

test('warns when a custom tabBar navigates to an unknown target', () => {
  renderRouter({
    _layout: () => (
      <Tabs
        tabBar={({ navigateToTab }) => (
          <Text testID="unknown-tab" onPress={() => navigateToTab('unknown-key')} />
        )}>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    index: () => null,
  });

  act(() => screen.getByTestId('unknown-tab').props.onPress());

  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Bottom tabs could not switch'));
});

test('lets a tabPress listener prevent navigation from a custom tabBar', async () => {
  function Second() {
    const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
    useEffect(
      () => navigation.addListener('tabPress', (event) => event.preventDefault()),
      [navigation]
    );
    return <View testID="second" />;
  }

  function CustomTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
    return (
      <View>
        {state.routes.map((route) => (
          <Text
            key={route.name}
            testID={`tab-${route.name}`}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigateToTab(route.key);
              }
            }}>
            {route.name}
          </Text>
        ))}
      </View>
    );
  }

  renderRouter({
    _layout: () => (
      <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" options={{ lazy: false }} />
      </Tabs>
    ),
    index: () => <View testID="index" />,
    second: Second,
  });

  await userEvent.press(screen.getByTestId('tab-second'));

  expect(screen).toHavePathname('/');
});

test('resets a nested stack when its tab loses focus with popToTopOnBlur', async () => {
  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="one" options={{ popToTopOnBlur: true }} />
          <Tabs.Screen name="two" />
        </Tabs>
      ),
      'one/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'one/index': () => <View testID="one-index" />,
      'one/details': () => <View testID="one-details" />,
      two: () => <View testID="two" />,
    },
    { initialUrl: '/one' }
  );

  act(() => router.push('/one/details'));

  expect(screen.getByTestId('one-details')).toBeVisible();

  await userEvent.press(screen.getByRole('button', { name: 'two, tab, 2 of 2' }));

  expect(screen.getByTestId('two')).toBeVisible();

  await userEvent.press(screen.getByRole('button', { name: 'one, tab, 1 of 2' }));

  // Without `popToTopOnBlur`, the details screen would still be active.
  expect(screen.getByTestId('one-index')).toBeVisible();
  expect(screen.queryByTestId('one-details')).toBeNull();
});
