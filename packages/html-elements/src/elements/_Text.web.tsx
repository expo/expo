import { ComponentType, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';

import { TextProps } from '../primitives/Text';
import { BlockQuoteProps, QuoteProps, TimeProps } from './Text.types';

export const P = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('p', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const B = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('b', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const S = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('s', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const Del = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('del', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const Strong = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('strong', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const I = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('i', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const Q = forwardRef(({ style, ...props }: QuoteProps, ref) => {
  return createElement('q', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<QuoteProps>;

export const BlockQuote = forwardRef(({ style, ...props }: BlockQuoteProps, ref) => {
  return createElement('blockquote', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<BlockQuoteProps>;

export const EM = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('em', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const BR = forwardRef((props: TextProps, ref) => {
  return createElement('br', { ...props, ref });
}) as ComponentType<TextProps>;

export const Small = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('small', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const Mark = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('mark', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

export const Code = forwardRef((props: TextProps, ref) => {
  return createElement('code', { ...props, ref });
}) as ComponentType<TextProps>;

export const Time = forwardRef(({ style, ...props }: TimeProps, ref) => {
  return createElement('time', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TimeProps>;

export const Pre = forwardRef(({ style, ...props }: TextProps, ref) => {
  return createElement('pre', { ...props, style: [styles.reset, style], ref });
}) as ComponentType<TextProps>;

const styles = StyleSheet.create({
  reset: {
    fontFamily: 'System',
    color: '#000',
    border: '0 solid black',
    boxSizing: 'border-box',
    // @ts-ignore: inline is not supported
    display: 'inline',
    margin: 0,
    padding: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
});
