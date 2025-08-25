import React from 'react';
import { DimensionValue, StyleSheet } from 'react-native';

import { em } from '../css/units';
import Text, { TextProps } from '../primitives/Text';

export function BR({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.br, style]} />;
}

const styles = StyleSheet.create({
  br: {
    width: 0,
    height: em(0.5) as DimensionValue,
  },
});
