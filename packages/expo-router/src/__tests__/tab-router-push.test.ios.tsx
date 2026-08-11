import { act, fireEvent, screen } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';
import { Drawer as DrawerLayout } from 'react-native-drawer-layout';

import { router } from '../imperative-api';
import { Drawer } from '../layouts/Drawer';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { NativeTabs } from '../native-tabs/NativeTabs';
import { INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME } from '../navigationParams';
import { DrawerActions } from '../react-navigation/native';
import { renderRouter } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs as HeadlessTabs } from '../ui';
import { useNavigation } from '../useNavigation';

jest.mock('react-native-drawer-layout', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');
  return {
    ...actual,
    Drawer: jest.fn(({ children, ...props }) => (
      <View testID="drawer" {...props}>
        {children}
      </View>
    )),
  };
});

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actual,
    ScreenStackItem: jest.fn(({ children }) => <View>{children}</View>),
    Tabs: {
      ...actual.Tabs,
      Host: jest.fn(({ children }) => <View>{children}</View>),
      Screen: jest.fn(({ children }) => <View>{children}</View>),
    },
  };
});

const drawerOpen = () =>
  (DrawerLayout as unknown as jest.Mock).mock.calls.at(-1)![0].open as boolean;

let warn: jest.SpyInstance | undefined;

afterEach(() => {
  warn?.mockRestore();
  warn = undefined;
});

it('push switches JS tabs without duplicating routes and follows back behavior', () => {
  const result = renderRouter({
    _layout: () => (
      <Tabs backBehavior="history">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
        <Tabs.Screen name="third" />
      </Tabs>
    ),
    index: () => null,
    second: () => null,
    third: () => null,
  });

  act(() => router.push('/second'));
  act(() => router.push('/third'));

  const tabState = result.getRouterState()!.routes[0]!.state;
  expect(tabState?.routes).toHaveLength(3);
  expect(screen).toHavePathname('/third');

  act(() => router.back());
  expect(screen).toHavePathname('/second');
});

it('push closes a drawer when switching routes', () => {
  function Index() {
    const navigation = useNavigation();
    return (
      <Button
        testID="open-drawer"
        title="Open drawer"
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
    );
  }

  renderRouter({
    _layout: () => (
      <Drawer>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
      </Drawer>
    ),
    index: Index,
    second: () => null,
  });

  fireEvent.press(screen.getByTestId('open-drawer'));
  expect(drawerOpen()).toBe(true);

  act(() => router.push('/second'));
  expect(screen).toHavePathname('/second');
  expect(drawerOpen()).toBe(false);
});

it('push closes a parent drawer when switching nested tabs', () => {
  function First() {
    const navigation = useNavigation();
    return (
      <Button
        testID="open-parent-drawer"
        title="Open drawer"
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
    );
  }

  renderRouter(
    {
      _layout: () => (
        <Drawer>
          <Drawer.Screen name="(tabs)" />
        </Drawer>
      ),
      '(tabs)/_layout': () => (
        <Tabs>
          <Tabs.Screen name="first" />
          <Tabs.Screen name="second" />
        </Tabs>
      ),
      '(tabs)/first': First,
      '(tabs)/second': () => null,
    },
    { initialUrl: '/first' }
  );

  fireEvent.press(screen.getByTestId('open-parent-drawer'));
  expect(drawerOpen()).toBe(true);

  act(() => router.push('/second'));
  expect(screen).toHavePathname('/second');
  expect(drawerOpen()).toBe(false);
});

it('push switches headless tabs to a nested route', () => {
  renderRouter({
    _layout: () => (
      <HeadlessTabs>
        <TabList>
          <TabTrigger name="index" href="/" />
          <TabTrigger name="fruit" href="/fruit" />
        </TabList>
        <TabSlot />
      </HeadlessTabs>
    ),
    index: () => null,
    'fruit/_layout': () => <Stack />,
    'fruit/index': () => <Text>Fruit</Text>,
    'fruit/details': () => <Text>Details</Text>,
  });

  act(() => router.push('/fruit/details'));

  expect(screen).toHavePathname('/fruit/details');
});

it('push switches native tabs and warns about zoom params', () => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="second" />
      </NativeTabs>
    ),
    index: () => <View />,
    second: () => <View />,
  });

  act(() =>
    router.push({
      pathname: '/second',
      params: {
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'source-id',
      },
    })
  );

  expect(screen).toHavePathname('/second');
  expect(warn).toHaveBeenCalledWith(
    'Zoom transition is not supported when navigating between tabs. Falling back to standard navigation transition.'
  );
});
