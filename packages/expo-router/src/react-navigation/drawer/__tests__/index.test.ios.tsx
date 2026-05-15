import 'react-native-gesture-handler/jestSetup';

import { expect, test } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Button, View } from 'react-native';

import { NavigationContainer } from '../../../fork/NavigationContainer';
import { Text } from '../../elements';
import { createNavigationContainerRef } from '../../native';
import { createDrawerNavigator, type DrawerScreenProps } from '../index';

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
    <NavigationContainer>
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
    <NavigationContainer ref={navigation}>
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
