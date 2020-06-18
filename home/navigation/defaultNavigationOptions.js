/* @flow */

import { Platform, StyleSheet } from 'react-native';

import Colors from '../constants/Colors';

export default ({ theme }) => {
  return {
    headerTintColor: Platform.select({
      ios: Colors.light.tintColor,
      android: Colors[theme].text,
    }),
    headerStyle: {
      borderBottomColor: Colors[theme].navBorderBottom,
      elevation: 0,
      backgroundColor: Colors[theme].navBackgroundColor,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitleStyle: {
      fontWeight: Platform.OS === 'ios' ? '600' : '400',
      color: Colors[theme].text,
    },
  };
};
