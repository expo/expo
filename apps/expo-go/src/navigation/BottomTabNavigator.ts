import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { ComponentProps } from 'react';

import { createNativeBottomTabsNavigator } from './NativeBottomTabsNavigator';

const BottomTabNavigator = createNativeBottomTabsNavigator();
export default BottomTabNavigator;

export const getNavigatorProps = (props: {
  theme: string;
}): Partial<ComponentProps<typeof BottomTabNavigator.Navigator>> => ({
  tabBarStyle: {
    backgroundColor:
      props.theme === 'dark' ? darkTheme.background.default : lightTheme.background.default,
  },
  tabBarActiveTintColor: props.theme === 'dark' ? darkTheme.link.default : lightTheme.link.default,
  tabBarInactiveTintColor:
    props.theme === 'dark' ? darkTheme.icon.default : lightTheme.icon.default,
});
