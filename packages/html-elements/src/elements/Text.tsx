import React from 'react';
import { StyleSheet, Platform } from 'react-native';

import { BlockQuoteProps, QuoteProps, TimeProps } from './Text.types';
import { em } from '../css/units';
import Text, { TextProps } from '../primitives/Text';
import View, { ViewProps } from '../primitives/View';

export function P({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.p, style]} />;
}

export function B({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.b, style]} />;
}

export function S({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.s, style]} />;
}

export function I({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.i, style]} />;
}

export function Q({ children, cite, style, ...props }: QuoteProps) {
  return (
    <Text {...props} style={[styles.q, style]}>
      "{children}"
    </Text>
  );
}

export function BlockQuote({ style, cite, ...props }: BlockQuoteProps) {
  return <View {...props} style={[styles.blockQuote, style]} />;
}

export function BR({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.br, style]} />;
}

export function Mark({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.mark, style]} />;
}

export function Code({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.code, style]} />;
}

function isTextProps(props: any): props is TextProps {
  return typeof props.children === 'string';
}

type PreProps = TextProps | ViewProps;

export function Pre(props: PreProps) {
  if (isTextProps(props)) {
    return <Text {...props} style={[styles.code, styles.pre, props.style]} />;
  }
  return <View {...props} style={[styles.pre, props.style]} />;
}

// Extract dateTime to prevent passing it to the native Text element
export function Time({ dateTime, ...props }: TimeProps) {
  return <Text {...props} />;
}

export const Strong = B;
export const Del = S;
export const EM = I;
export const Span = Text;

const styles = StyleSheet.create({
  p: {
    // @ts-ignore
    marginVertical: em(1),
  },
  b: {
    fontWeight: 'bold',
  },
  q: {
    fontStyle: 'italic',
  },
  code: {
    fontFamily: Platform.select({
      default: `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
      ios: 'ui-monospace',
      android: 'monospace',
    }),
    fontWeight: '500',
  },
  pre: {
    // @ts-ignore
    marginVertical: em(1),
  },
  blockQuote: {
    // @ts-ignore
    marginVertical: em(1),
  },
  br: {
    width: 0,
    // @ts-ignore
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
