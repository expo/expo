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

export const Br = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.br, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const Small = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.small, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const Mark = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.mark, style]} ref={ref} />;
}) as ComponentType<TextProps>;

// TODO: Lazy load mono font on native
export const Code = forwardRef((props: TextProps, ref) => {
  return <Text {...props} ref={ref} />;
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
  br: {
    width: 0,
    height: 8,
  },
  small: {
    fontSize: 10,
  },
  s: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  mark: {
    backgroundColor: 'yellow',
    color: 'black',
  },
  i: {
    fontStyle: 'italic',
  },
});
