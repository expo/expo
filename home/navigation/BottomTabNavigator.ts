import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ComponentProps } from 'react';

import FeatureFlags from '../FeatureFlags';

const BottomTabNavigator = createBottomTabNavigator();
export default BottomTabNavigator;

export const getNavigatorProps = (props: {
  theme: string;
}): Partial<ComponentProps<typeof BottomTabNavigator.Navigator>> => ({
  tabBarOptions: {
    labelStyle: { fontFamily: 'Inter-SemiBold' },
    keyboardHidesTabBar: false,
    ...(FeatureFlags.ENABLE_2022_NAVIGATION_REDESIGN && {
      style: {
        backgroundColor:
          props.theme === 'dark' ? darkTheme.background.default : lightTheme.background.default,
      },
      activeTintColor: props.theme === 'dark' ? darkTheme.link.default : lightTheme.link.default,
      inactiveTintColor: props.theme === 'dark' ? darkTheme.icon.default : lightTheme.icon.default,
    }),
  },
});
