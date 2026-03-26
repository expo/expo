import { expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';
import { Button, View } from 'react-native';

import { Text } from '../../elements';
import { NavigationContainer } from '../../native';
import { createMaterialTopTabNavigator, type MaterialTopTabScreenProps } from '../index';

type TopTabParamList = {
  A: undefined;
  B: undefined;
};

jest.mock('react-native-pager-view', () => {
  const React = require('react');
  const { View } = require('react-native');

  return class ViewPager extends React.Component<React.PropsWithChildren<{}>> {
    // eslint-disable-next-line @eslint-react/no-unused-class-component-members
    setPage() {}

    render() {
      return <View>{this.props.children}</View>;
    }
  };
});

jest.mock(
  'react-native-tab-view',
  () => {
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');

    return {
      TabView: ({ navigationState, renderScene, renderTabBar }: any) => {
        return (
          <View>
            {renderTabBar({
              navigationState,
              options: {},
            })}
            {renderScene({
              route: navigationState.routes[navigationState.index],
              position: { interpolate: () => 0 },
            })}
          </View>
        );
      },
      TabBar: ({ navigationState, onTabPress, options }: any) => {
        return (
          <View>
            {navigationState.routes.map((route: any) => (
              <Pressable
                key={route.key}
                onPress={() => onTabPress({ route, preventDefault: () => {} })}>
                <Text>{options?.[route.key]?.labelText ?? route.name}</Text>
              </Pressable>
            ))}
          </View>
        );
      },
      TabBarIndicator: () => null,
    };
  },
  { virtual: true }
);

test('renders a material top tab navigator with screens', async () => {
  const Test = ({ route, navigation }: MaterialTopTabScreenProps<TopTabParamList>) => (
    <View>
      <Text>Screen {route.name}</Text>
      <Button onPress={() => navigation.navigate('A')} title="Go to A" />
      <Button onPress={() => navigation.navigate('B')} title="Go to B" />
    </View>
  );

  const Tab = createMaterialTopTabNavigator<TopTabParamList>();

  const { findByText, queryByText } = render(
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="A" component={Test} />
        <Tab.Screen name="B" component={Test} />
      </Tab.Navigator>
    </NavigationContainer>
  );

  expect(queryByText('Screen A')).not.toBeNull();
  expect(queryByText('Screen B')).toBeNull();

  fireEvent(await findByText('Go to B'), 'press');

  expect(queryByText('Screen B')).not.toBeNull();
});
