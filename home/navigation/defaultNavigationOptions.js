/* @flow */

import { Platform, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default ({ theme }) => {
  return {
    headerStyle: {
      backgroundColor: Colors[theme].navBackgroundColor,
      borderBottomColor: Colors[theme].navBorderBottom,
      borderBottomWidth: StyleSheet.hairlineWidth,
      elevation: 0,
    },
    headerTitleStyle: {
      fontWeight: Platform.OS === 'ios' ? '600' : '400',
    },
  };
};
