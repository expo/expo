import 'react-native-gesture-handler/jestSetup';

import { expect, test } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Button, View } from 'react-native';

import { NavigationContainer } from '../../../fork/NavigationContainer';
import { Text } from '../../elements';
import { createNavigationContainerRef } from '../../native';
import {
  createDrawerNavigator,
  type DrawerScreenProps,
  useDrawerActions,
  useDrawerStatus,
} from '../index';

jest.mock('react-native-drawer-layout', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');
  const Drawer = jest.fn((props) => <View testID="Drawer" {...props} />);
  return {
    ...actual,
    Drawer,
  };
});

type DrawerParamList = {
  A: undefined;
  B: undefined;
};

test('renders a drawer navigator with screens', async () => {
  const Test = ({ route, navigation }: DrawerScreenProps<DrawerParamList>) => (
    <View>
      <Text>Screen {route.name}</Text>
      <Button onPress={() => navigation.navigate('A')} title="Go to A" />
      <Button onPress={() => navigation.navigate('B')} title="Go to B" />
    </View>
  );

  const Drawer = createDrawerNavigator<DrawerParamList>();

  const { findByText, queryByText } = render(
    <NavigationContainer
      initialState={{
        stale: false as const,
        index: 0,
        key: 'drawer',
        routeNames: ['A', 'B'],
        routes: [{ key: 'A', name: 'A' }],
      }}>
      <Drawer.Navigator>
        <Drawer.Screen name="A" component={Test} />
        <Drawer.Screen name="B" component={Test} />
      </Drawer.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Screen A')).not.toBeNull();
  expect(queryByText('Screen B')).toBeNull();

  fireEvent(await findByText('Go to B'), 'press');

  expect(queryByText('Screen B')).not.toBeNull();
});

test('handles screens preloading', async () => {
  const Drawer = createDrawerNavigator<DrawerParamList>();

  const navigation = createNavigationContainerRef<DrawerParamList>();

  const { queryByText } = render(
    <NavigationContainer
      ref={navigation}
      initialState={{
        stale: false as const,
        index: 0,
        key: 'drawer',
        routeNames: ['A', 'B'],
        routes: [{ key: 'A', name: 'A' }],
      }}>
      <Drawer.Navigator>
        <Drawer.Screen name="A">{() => null}</Drawer.Screen>
        <Drawer.Screen name="B">{() => <Text>Screen B</Text>}</Drawer.Screen>
      </Drawer.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Screen B', { includeHiddenElements: true })).toBeNull();
  act(() => navigation.preload('B'));
  expect(queryByText('Screen B', { includeHiddenElements: true })).not.toBeNull();
});

const StatusScreen = ({ route, navigation }: DrawerScreenProps<DrawerParamList>) => {
  const status = useDrawerStatus();
  const { openDrawer, closeDrawer, toggleDrawer } = useDrawerActions();

  return (
    <View>
      <Text>Screen {route.name}</Text>
      <Text>Status: {status}</Text>
      <Button onPress={openDrawer} title="open" />
      <Button onPress={closeDrawer} title="close" />
      <Button onPress={toggleDrawer} title="toggle" />
      <Button onPress={() => navigation.navigate('B')} title="Go to B" />
    </View>
  );
};

test('opens, closes, and toggles the drawer via useDrawerActions', async () => {
  const Drawer = createDrawerNavigator<DrawerParamList>();

  const { getByText, findByText } = render(
    <NavigationContainer
      initialState={{
        stale: false as const,
        index: 0,
        key: 'drawer',
        routeNames: ['A', 'B'],
        routes: [{ key: 'A', name: 'A' }],
      }}>
      <Drawer.Navigator>
        <Drawer.Screen name="A" component={StatusScreen} />
        <Drawer.Screen name="B" component={StatusScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );

  expect(getByText('Status: closed')).not.toBeNull();

  fireEvent(await findByText('open'), 'press');
  expect(getByText('Status: open')).not.toBeNull();

  fireEvent(getByText('close'), 'press');
  expect(getByText('Status: closed')).not.toBeNull();

  fireEvent(getByText('toggle'), 'press');
  expect(getByText('Status: open')).not.toBeNull();

  fireEvent(getByText('toggle'), 'press');
  expect(getByText('Status: closed')).not.toBeNull();
});

test('navigating to another route closes an open drawer', async () => {
  const Drawer = createDrawerNavigator<DrawerParamList>();

  const { getByText, findByText } = render(
    <NavigationContainer
      initialState={{
        stale: false as const,
        index: 0,
        key: 'drawer',
        routeNames: ['A', 'B'],
        routes: [{ key: 'A', name: 'A' }],
      }}>
      <Drawer.Navigator>
        <Drawer.Screen name="A" component={StatusScreen} />
        <Drawer.Screen name="B" component={StatusScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );

  fireEvent(await findByText('open'), 'press');
  expect(getByText('Status: open')).not.toBeNull();

  fireEvent(getByText('Go to B'), 'press');

  expect(getByText('Screen B')).not.toBeNull();
  expect(getByText('Status: closed')).not.toBeNull();
});

test("defaultStatus 'open' starts open and can be toggled closed", async () => {
  const Drawer = createDrawerNavigator<DrawerParamList>();

  const { getByText, findByText } = render(
    <NavigationContainer
      initialState={{
        stale: false as const,
        index: 0,
        key: 'drawer',
        routeNames: ['A', 'B'],
        routes: [{ key: 'A', name: 'A' }],
      }}>
      <Drawer.Navigator defaultStatus="open">
        <Drawer.Screen name="A" component={StatusScreen} />
        <Drawer.Screen name="B" component={StatusScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );

  expect(getByText('Status: open')).not.toBeNull();

  fireEvent(await findByText('toggle'), 'press');
  expect(getByText('Status: closed')).not.toBeNull();
});

test("defaultStatus 'open': navigating returns the drawer to its open default", async () => {
  const Drawer = createDrawerNavigator<DrawerParamList>();

  const { getByText, findByText } = render(
    <NavigationContainer
      initialState={{
        stale: false as const,
        index: 0,
        key: 'drawer',
        routeNames: ['A', 'B'],
        routes: [{ key: 'A', name: 'A' }],
      }}>
      <Drawer.Navigator defaultStatus="open">
        <Drawer.Screen name="A" component={StatusScreen} />
        <Drawer.Screen name="B" component={StatusScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );

  // Close it, then navigate: the drawer returns to its default (open) status.
  fireEvent(await findByText('close'), 'press');
  expect(getByText('Status: closed')).not.toBeNull();

  fireEvent(getByText('Go to B'), 'press');

  expect(getByText('Screen B')).not.toBeNull();
  expect(getByText('Status: open')).not.toBeNull();
});
