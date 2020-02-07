import React, { ComponentType, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import View, { ViewProps } from '../primitives/View';

export const Hr = forwardRef((props: ViewProps, ref) => {
  return <View {...props} style={[styles.hr, props.style]} ref={ref} />;
}) as ComponentType<ViewProps>;

const styles = StyleSheet.create({
  hr: {
    height: 1,
    backgroundColor: '#000000',
  },
});
