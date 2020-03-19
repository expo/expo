import React, { ComponentType, forwardRef } from 'react';
import { StyleSheet } from 'react-native';

import Text, { TextProps } from '../primitives/Text';
import View, { ViewProps } from '../primitives/View';

export const BR = forwardRef((props: TextProps, ref) => (
  <Text {...props} ref={ref}>
    {'\n'}
  </Text>
)) as ComponentType<TextProps>;

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
