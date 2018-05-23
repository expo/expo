/* @flow */

import { Platform, StyleSheet } from 'react-native';

export default {
  headerStyle: {
    backgroundColor: '#fff',
    elevation: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(46, 59, 76, 0.10)',
  },
  headerTitleStyle: {
    fontWeight: Platform.OS === 'ios' ? '600' : '400',
  },
};
