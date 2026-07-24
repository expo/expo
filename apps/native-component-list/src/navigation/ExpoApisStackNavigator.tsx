import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'ThemeProvider';
import * as React from 'react';

import { TabBackground } from '../components/TabBackground';
import TabIcon from '../components/TabIcon';
import getStackNavWithConfig from '../navigation/StackConfig';
import ExpoApis from '../screens/ExpoApisScreen';
import { ScreensList, Screens, screenApiItems } from './apiScreens';

export { ScreensList, Screens, screenApiItems };

const Stack = createNativeStackNavigator();

function ExpoApisStackNavigator(props: { navigation: BottomTabNavigationProp<any> }) {
  const { theme } = useTheme();

  return (
    <Stack.Navigator {...props} {...getStackNavWithConfig(props.navigation, theme)}>
      <Stack.Screen name="ExpoApis" options={{ title: 'APIs in Expo SDK' }}>
        {() => <ExpoApis apis={screenApiItems} />}
      </Stack.Screen>
      {Screens.map(({ name, options, getComponent }) => (
        <Stack.Screen name={name} key={name} getComponent={getComponent} options={options ?? {}} />
      ))}
    </Stack.Navigator>
  );
}

ExpoApisStackNavigator.navigationOptions = {
  title: 'APIs',
  tabBarLabel: 'APIs',
  tabBarIcon: ({ focused }: { focused: boolean }) => {
    return <TabIcon name="code-tags" focused={focused} />;
  },
  tabBarBackground: () => <TabBackground />,
};

export default ExpoApisStackNavigator;
