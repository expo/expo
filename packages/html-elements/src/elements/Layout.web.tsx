import { ComponentType, forwardRef } from 'react';
import { createElement, StyleSheet } from 'react-native';
import { ViewProps } from '../primitives/View';

export const Footer = forwardRef((props: ViewProps, ref) => {
  return createElement('footer', { ...props, style: [styles.footer, props.style], ref });
}) as ComponentType<ViewProps>;

export const Nav = forwardRef((props: ViewProps, ref) => {
  return createElement('nav', { ...props, style: [styles.nav, props.style], ref });
}) as ComponentType<ViewProps>;

const styles = StyleSheet.create({
  footer: {
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
  },
});
