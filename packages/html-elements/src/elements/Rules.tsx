import React, { ComponentType, forwardRef } from 'react';
import { StyleSheet } from 'react-native';

import View, { ViewProps } from '../primitives/View';

export const HR = forwardRef((props: ViewProps, ref) => {
  return <View {...props} style={[styles.hr, props.style]} ref={ref} />;
}) as ComponentType<ViewProps>;

const styles = StyleSheet.create({
  hr: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#9A9A9A',
    borderBottomColor: '#EEEEEE',
    marginVertical: 8,
  },
});
