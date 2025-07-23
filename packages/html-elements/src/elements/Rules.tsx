import React from 'react';
import { StyleSheet } from 'react-native';

import View, { ViewProps } from '../primitives/View';

export function HR(props: ViewProps) {
  return <View {...props} style={[styles.hr, props.style]} />;
}

const styles = StyleSheet.create({
  hr: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#9A9A9A',
    borderBottomColor: '#EEEEEE',
    marginVertical: 8,
  },
});
