import { ComponentType, forwardRef } from 'react';
import { createElement, StyleSheet } from 'react-native';

import { TextProps } from '../primitives/Text';
import { ViewProps } from '../primitives/View';

export const Ul = forwardRef((props: ViewProps, ref) => {
  return createElement('ul', { ...props, style: [{ listStyleType: 'initial' }, props.style], ref });
}) as ComponentType<ViewProps>;

export const Ol = forwardRef((props: ViewProps, ref) => {
  return createElement('ol', { ...props, style: [props.style], ref });
}) as ComponentType<ViewProps>;

export const Li = forwardRef((props: TextProps, ref) => {
  return createElement('li', {
    ...props,
    style: [styles.reset, { listStyleType: 'inherit' }, props.style],
    ref,
  });
}) as ComponentType<TextProps>;

const styles = StyleSheet.create({
  reset: {
    fontFamily: 'System',
  },
});
