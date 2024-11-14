import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

const BottomTabNavigator = createBottomTabNavigator();
export default BottomTabNavigator;

export const getNavigatorProps = (props: {
  theme: string;
}): Partial<ComponentProps<typeof BottomTabNavigator.Navigator>> => ({
  screenOptions: {
    headerShown: false,
    tabBarLabelStyle: { fontFamily: 'Inter-SemiBold' },
    tabBarHideOnKeyboard: false,
    tabBarStyle: {
      backgroundColor:
        props.theme === 'dark' ? darkTheme.background.default : lightTheme.background.default,
      borderTopColor: props.theme === 'dark' ? darkTheme.border.default : lightTheme.border.default,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    tabBarActiveTintColor:
      props.theme === 'dark' ? darkTheme.link.default : lightTheme.link.default,
    tabBarInactiveTintColor:
      props.theme === 'dark' ? darkTheme.icon.default : lightTheme.icon.default,
  },
});
