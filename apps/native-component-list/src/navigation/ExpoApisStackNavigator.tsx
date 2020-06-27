import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import TabIcon from '../components/TabIcon';
import ExpoApis from '../screens/ExpoApisScreen';
import { Screens } from './ExpoApis';
import StackConfig from './StackConfig';

const Stack = createStackNavigator();

function ExpoApisStackNavigator(props: { navigation: BottomTabNavigationProp<any> }) {
  return (
    <Stack.Navigator {...props} {...StackConfig}>
      <Stack.Screen name="ExpoApis" options={{ title: 'APIs in Expo SDK' }} component={ExpoApis} />

      {Object.keys(Screens).map(name => (
        <Stack.Screen
          name={name}
          key={name}
          component={Screens[name]}
          options={(Screens[name] as any).navigationOptions ?? {}}
        />
      ))}
    </Stack.Navigator>
  );
}
ExpoApisStackNavigator.navigationOptions = {
  title: 'Expo APIs',
  tabBarLabel: 'APIs',
  tabBarIcon: ({ focused }: { focused: boolean }) => {
    return <TabIcon name="exponent-box" focused={focused} />;
  },
};

export default ExpoApisStackNavigator;
