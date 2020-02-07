import React, { ComponentType, forwardRef } from 'react';
import { StyleSheet } from 'react-native';

import { em } from '../css/units';
import Text, { TextProps } from '../primitives/Text';

export const P = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.p, style]} ref={ref} />;
}) as ComponentType<TextProps>;

const styles = StyleSheet.create({
  p: {
    marginVertical: em(1),
    fontSize: em(1),
  },
});
