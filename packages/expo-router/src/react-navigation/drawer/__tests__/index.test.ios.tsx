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

test('renders a drawer navigator and navigates between screens', () => {
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

  act(() => router.navigate('/second'));

  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen).toHavePathname('/second');
});

test('handles drawer actions and preventable item presses', () => {
  function Second() {
    const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
    useEffect(
      () => navigation.addListener('drawerItemPress', (event) => event.preventDefault()),
      [navigation]
    );
    return <View testID="second" />;
  }

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
        <Drawer.Screen name="second" options={{ lazy: false }} />
      </Drawer>
    ),
    index: Index,
    second: Second,
  });

  expect(drawerOpen()).toBe(false);
  fireEvent.press(screen.getByTestId('open-drawer'));
  expect(drawerOpen()).toBe(true);

  fireEvent.press(screen.getByText('second'));
  expect(screen).toHavePathname('/');
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

test('pops a nested stack to top on blur', () => {
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

  act(() => router.push('/one/details'));
  act(() => router.navigate('/two'));
  act(() => router.navigate('/one'));

  expect(screen.getByTestId('one-index')).toBeVisible();
  expect(screen.queryByTestId('one-details')).toBeNull();
});
