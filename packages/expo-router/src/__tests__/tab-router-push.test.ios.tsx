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

it('push switches JS tabs without duplicating routes and follows back behavior', async () => {
  const result = await renderRouter({
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

  await act(() => router.push('/second'));
  await act(() => router.push('/third'));

  const tabState = result.getRouterState()!.routes[0]!.state;
  expect(tabState?.routes).toHaveLength(3);
  expect(screen).toHavePathname('/third');

  await act(() => router.push('/third'));
  const tabStateAfterDuplicatePush = result.getRouterState()!.routes[0]!.state;
  expect(tabStateAfterDuplicatePush?.routes).toHaveLength(3);
  expect(tabStateAfterDuplicatePush?.index).toBe(2);

  await act(() => router.back());
  expect(screen).toHavePathname('/second');
});

it('push closes a drawer when switching routes', async () => {
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

  await renderRouter({
    _layout: () => (
      <Drawer>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
      </Drawer>
    ),
    index: Index,
    second: () => null,
  });

  await fireEvent.press(screen.getByTestId('open-drawer'));
  expect(drawerOpen()).toBe(true);

  await act(() => router.push('/second'));
  expect(screen).toHavePathname('/second');
  expect(drawerOpen()).toBe(false);
});

it('push closes a parent drawer when switching nested tabs', async () => {
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

  await renderRouter(
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

  await fireEvent.press(screen.getByTestId('open-parent-drawer'));
  expect(drawerOpen()).toBe(true);

  await act(() => router.push('/second'));
  expect(screen).toHavePathname('/second');
  expect(drawerOpen()).toBe(false);
});

it('push closes a parent drawer when switching a nested stack', async () => {
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

  await renderRouter(
    {
      _layout: () => (
        <Drawer>
          <Drawer.Screen name="(stack)" />
        </Drawer>
      ),
      '(stack)/_layout': () => <Stack />,
      '(stack)/first': First,
      '(stack)/second': () => null,
    },
    { initialUrl: '/first' }
  );

  await fireEvent.press(screen.getByTestId('open-parent-drawer'));
  expect(drawerOpen()).toBe(true);

  await act(() => router.push('/second'));
  expect(screen).toHavePathname('/second');
  expect(drawerOpen()).toBe(false);
});

it('push switches headless tabs to a nested route and anchors the target stack', async () => {
  const result = await renderRouter({
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
    'fruit/_layout': {
      default: () => <Stack />,
      unstable_settings: { anchor: 'index' },
    },
    'fruit/index': () => <Text>Fruit</Text>,
    'fruit/details': () => <Text>Details</Text>,
  });

  await act(() => router.push('/fruit/details', { withAnchor: true }));

  expect(screen).toHavePathname('/fruit/details');

  const fruitRoute = result
    .getRouterState()!
    .routes[0]!.state!.routes.find((route) => route.name === 'fruit')!;
  expect(fruitRoute.state!.routes.map((route) => route.name)).toEqual(['index', 'details']);
});

it('push switches native tabs and warns about zoom params', async () => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="second" />
      </NativeTabs>
    ),
    index: () => <View />,
    second: () => <View />,
  });

  await act(() =>
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
