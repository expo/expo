import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ComponentProps } from 'react';

const BottomTabNavigator = createBottomTabNavigator();
export default BottomTabNavigator;

export const getNavigatorProps = (props: {
  theme: string;
}): Partial<ComponentProps<typeof BottomTabNavigator.Navigator>> => ({
  tabBarOptions: {
    labelStyle: { fontFamily: 'Inter-SemiBold' },
    keyboardHidesTabBar: false,
    style: {
      backgroundColor:
        props.theme === 'dark' ? darkTheme.background.default : lightTheme.background.default,
    },
    activeTintColor: props.theme === 'dark' ? darkTheme.link.default : lightTheme.link.default,
    inactiveTintColor: props.theme === 'dark' ? darkTheme.icon.default : lightTheme.icon.default,
  },
});
