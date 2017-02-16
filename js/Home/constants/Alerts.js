/* @flow */

import { StyleSheet } from 'react-native';
import Colors from './Colors';

export default {
  error: StyleSheet.create({
    container: {
      backgroundColor: 'red',
    },
    text: {
      color: 'white',
    },
  }),
  notice: StyleSheet.create({
    container: {
      backgroundColor: Colors.darkTintColor,
    },
    text: {
      color: '#fff',
      fontSize: 13,
    },
  }),
  warning: StyleSheet.create({
    container: {
      backgroundColor: '#EAEB5E',
    },
    text: {
      color: '#666804',
    },
  }),
};
