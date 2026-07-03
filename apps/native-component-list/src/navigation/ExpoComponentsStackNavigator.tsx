import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'ThemeProvider';
import * as React from 'react';

import { TabBackground } from '../components/TabBackground';
import TabIcon from '../components/TabIcon';
import { Layout } from '../constants';
import ExpoComponents from '../screens/ExpoComponentsScreen';
import getStackNavWithConfig from './StackConfig';
import { ScreensList, Screens, screenApiItems } from './componentScreens';

export { ScreensList, Screens, screenApiItems };

const Stack = createNativeStackNavigator();

function ExpoComponentsStackNavigator(props: { navigation: BottomTabNavigationProp<any> }) {
  const { theme } = useTheme();
  return (
    <Stack.Navigator {...props} {...getStackNavWithConfig(props.navigation, theme)}>
      <Stack.Screen
        name="ExpoComponents"
        options={{
          title: Layout.isSmallDevice ? 'Expo SDK Components' : 'Components in Expo SDK',
        }}>
        {() => <ExpoComponents apis={screenApiItems} />}
      </Stack.Screen>
      {Screens.map(({ name, getComponent, options }) => (
        <Stack.Screen name={name} key={name} getComponent={getComponent} options={options ?? {}} />
      ))}
    </Stack.Navigator>
  );
}

ExpoComponentsStackNavigator.navigationOptions = {
  title: 'Components',
  tabBarLabel: 'Components',
  tabBarIcon: ({ focused }: { focused: boolean }) => {
    return <TabIcon name="react" focused={focused} />;
  },
  tabBarBackground: () => <TabBackground />,
};

export default ExpoComponentsStackNavigator;
