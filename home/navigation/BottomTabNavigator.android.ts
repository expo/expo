import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import Colors from '../constants/Colors';

const BottomTabNavigator = createMaterialBottomTabNavigator();

export default BottomTabNavigator;

export const getNavigatorProps = (props: {
  theme: string;
}): Partial<ComponentProps<typeof BottomTabNavigator.Navigator>> => ({
  shifting: true,
  activeColor: Colors[props.theme].tabIconSelected,
  inactiveColor: Colors[props.theme].tabIconDefault,
  barStyle: {
    backgroundColor: Colors[props.theme].cardBackground,
    borderTopWidth:
      props.theme === 'dark' ? StyleSheet.hairlineWidth * 2 : StyleSheet.hairlineWidth,
    borderTopColor: Colors[props.theme].cardSeparator,
  },
});
