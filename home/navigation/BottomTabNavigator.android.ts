import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import FeatureFlags from '../FeatureFlags';
import Colors, { ColorTheme } from '../constants/Colors';

const BottomTabNavigator = createMaterialBottomTabNavigator();

export default BottomTabNavigator;

export const getNavigatorProps = (props: {
  theme: ColorTheme;
}): Partial<ComponentProps<typeof BottomTabNavigator.Navigator>> => ({
  shifting: true,
  activeColor: Colors[props.theme].tabIconSelected,
  inactiveColor: Colors[props.theme].tabIconDefault,
  ...(FeatureFlags.ENABLE_2022_NAVIGATION_REDESIGN && {
    activeColor: props.theme === 'dark' ? darkTheme.link.default : lightTheme.link.default,
    inactiveColor: props.theme === 'dark' ? darkTheme.icon.default : lightTheme.icon.default,
  }),
  barStyle: {
    backgroundColor: Colors[props.theme].cardBackground,
    borderTopWidth:
      props.theme === 'dark' ? StyleSheet.hairlineWidth * 2 : StyleSheet.hairlineWidth,
    borderTopColor: Colors[props.theme].cardSeparator,
    ...(FeatureFlags.ENABLE_2022_NAVIGATION_REDESIGN && {
      backgroundColor:
        props.theme === 'dark' ? darkTheme.background.default : lightTheme.background.default,
    }),
  },
});
