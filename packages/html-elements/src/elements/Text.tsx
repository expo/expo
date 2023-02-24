import React, { ComponentType, forwardRef } from 'react';
import { StyleSheet, Platform } from 'react-native';

import { em } from '../css/units';
import Text, { TextProps } from '../primitives/Text';
import View, { ViewProps } from '../primitives/View';
import { BlockQuoteProps, QuoteProps, TimeProps } from './Text.types';

export const P = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.p, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const B = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.b, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const S = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.s, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const I = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.i, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const Q = forwardRef(({ children, cite, style, ...props }: QuoteProps, ref) => {
  return (
    <Text {...props} style={[styles.q, style]} ref={ref}>
      "{children}"
    </Text>
  );
}) as ComponentType<QuoteProps>;

export const BlockQuote = forwardRef(({ style, cite, ...props }: BlockQuoteProps, ref) => {
  return <View {...props} style={[styles.blockQuote, style]} ref={ref} />;
}) as ComponentType<BlockQuoteProps>;

export const BR = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.br, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const Mark = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.mark, style]} ref={ref} />;
}) as ComponentType<TextProps>;

export const Code = forwardRef(({ style, ...props }: TextProps, ref) => {
  return <Text {...props} style={[styles.code, style]} ref={ref} />;
}) as ComponentType<TextProps>;

function isTextProps(props: any): props is TextProps {
  return typeof props.children === 'string';
}

type PreProps = TextProps | ViewProps;

export const Pre = forwardRef((props: PreProps, ref: any) => {
  if (isTextProps(props)) {
    return <Text {...props} style={[styles.code, styles.pre, props.style]} ref={ref} />;
  }
  return <View {...props} style={[styles.pre, props.style]} ref={ref} />;
}) as ComponentType<PreProps>;

// Extract dateTime to prevent passing it to the native Text element
export const Time = forwardRef(({ dateTime, ...props }: TimeProps, ref) => {
  return <Text {...props} ref={ref} />;
}) as ComponentType<TimeProps>;

export const Strong = B;
export const Del = S;
export const EM = I;
export const Span = Text;

const styles = StyleSheet.create({
  p: {
    marginVertical: em(1),
  },
  b: {
    fontWeight: 'bold',
  },
  q: {
    fontStyle: 'italic',
  },
  code: {
    fontFamily: Platform.select({ default: 'Courier', ios: 'Courier New', android: 'monospace' }),
    fontWeight: '500',
  },
  pre: {
    marginVertical: em(1),
  },
  blockQuote: {
    marginVertical: em(1),
  },
  br: {
    width: 0,
    height: em(0.5),
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
