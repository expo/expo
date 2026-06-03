import 'react-native-gesture-handler/jestSetup';

import { useEffect } from 'react';
import { Button, Text, View } from 'react-native';
import { Drawer as DrawerLayout } from 'react-native-drawer-layout';

import { router } from '../../../imperative-api';
import { Drawer } from '../../../layouts/Drawer';
import { Stack } from '../../../layouts/Stack';
import { act, fireEvent, renderRouter, screen } from '../../../testing-library';
import { useNavigation } from '../../../useNavigation';
import { DrawerActions, type ParamListBase } from '../../native';
import type { DrawerNavigationProp } from '../types';

jest.mock('react-native-drawer-layout', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');
  const Drawer = jest.fn(({ renderDrawerContent, children, ...props }) => (
    <View testID="Drawer" {...props}>
      {renderDrawerContent?.()}
      {children}
    </View>
  ));
  return {
    ...actual,
    Drawer,
  };
});

const drawerOpen = () =>
  (DrawerLayout as unknown as jest.Mock).mock.calls.at(-1)![0].open as boolean;

beforeEach(() => {
  (DrawerLayout as unknown as jest.Mock).mockClear();
});

test('renders a drawer navigator with screens', () => {
  renderRouter({
    _layout: () => (
      <Drawer>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
      </Drawer>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('second')).toBeNull();
  expect(screen).toHavePathname('/');
});

test('navigates between routes imperatively', () => {
  renderRouter({
    _layout: () => (
      <Drawer>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
      </Drawer>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  act(() => router.navigate('/second'));

  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen).toHavePathname('/second');
});

test('navigates when a drawer item is pressed', () => {
  renderRouter({
    _layout: () => (
      <Drawer>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
      </Drawer>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  // The default drawer content renders an item per route, labelled by route name.
  fireEvent.press(screen.getByText('second'));

  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen).toHavePathname('/second');
});

test('does not navigate when drawerItemPress is prevented', () => {
  // The pressed item targets the "second" route, so its screen registers the listener. It must not be
  // lazy, otherwise it would not be mounted to register the listener before being pressed.
  function Second() {
    const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
    useEffect(
      () => navigation.addListener('drawerItemPress', (e) => e.preventDefault()),
      [navigation]
    );
    return <View testID="second" />;
  }

  renderRouter({
    _layout: () => (
      <Drawer>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" options={{ lazy: false }} />
      </Drawer>
    ),
    index: () => <View testID="index" />,
    second: Second,
  });

  fireEvent.press(screen.getByText('second'));

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
});

test('reflects the drawer status in the underlying drawer layout', () => {
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
    second: () => <View testID="second" />,
  });

  expect(drawerOpen()).toBe(false);

  fireEvent.press(screen.getByTestId('open-drawer'));

  expect(drawerOpen()).toBe(true);
});

test('preloads screens', () => {
  function Index() {
    const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
    return <Button testID="preload" title="Preload" onPress={() => navigation.preload('second')} />;
  }

  renderRouter({
    _layout: () => (
      <Drawer>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
      </Drawer>
    ),
    index: Index,
    second: () => <Text>Second screen</Text>,
  });

  expect(screen.queryByText('Second screen', { includeHiddenElements: true })).toBeNull();

  fireEvent.press(screen.getByTestId('preload'));

  expect(screen.queryByText('Second screen', { includeHiddenElements: true })).not.toBeNull();
});

test('pops a nested stack to top on blur when popToTopOnBlur is set', () => {
  renderRouter(
    {
      _layout: () => (
        <Drawer>
          <Drawer.Screen name="one" options={{ popToTopOnBlur: true }} />
          <Drawer.Screen name="two" />
        </Drawer>
      ),
      'one/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'one/index': () => <View testID="one-index" />,
      'one/details': () => <View testID="one-details" />,
      two: () => <View testID="two" />,
    },
    { initialUrl: '/one' }
  );

  expect(screen.getByTestId('one-index')).toBeVisible();

  act(() => router.push('/one/details'));
  expect(screen.getByTestId('one-details')).toBeVisible();

  // Blur the "one" drawer route — this should pop its nested stack to top.
  act(() => router.navigate('/two'));
  expect(screen.getByTestId('two')).toBeVisible();

  // Returning to "one" lands on the nested stack's top route, not the previously pushed "details".
  act(() => router.navigate('/one'));
  expect(screen.getByTestId('one-index')).toBeVisible();
  expect(screen.queryByTestId('one-details')).toBeNull();
});
