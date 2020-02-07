import React, { ComponentType, forwardRef } from 'react';
import { StyleSheet } from 'react-native';

import { em } from '../css/units';
import Text, { TextProps } from '../primitives/Text';

export const P = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.p, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const B = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <P {...props} style={[styles.b, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const S = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <P {...props} style={[styles.s, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const I = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <P {...props} style={[styles.i, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const Strong = B;
export const Strike = S;
export const Em = I;

const styles = StyleSheet.create({
  p: {
    marginVertical: em(1),
    fontSize: em(1),
  },
  b: {
    fontWeight: 'bold',
  },
  s: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  i: {
    fontStyle: 'italic',
  },
});
