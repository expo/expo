import { ComponentType, forwardRef } from 'react';
import { StyleSheet, createElement } from 'react-native';

import { TableTextProps } from '../primitives/Table';
import { TextProps } from '../primitives/Text';
import { ViewProps } from '../primitives/View';

export const Table = forwardRef((props: ViewProps, ref) => {
  return createElement('table', { ...props, style: [styles.reset, props.style], ref });
}) as ComponentType<ViewProps>;

export const THead = forwardRef((props: ViewProps, ref) => {
  return createElement('thead', { ...props, style: [styles.reset, props.style], ref });
}) as ComponentType<ViewProps>;

export const TBody = forwardRef((props: ViewProps, ref) => {
  return createElement('tbody', { ...props, style: [styles.reset, props.style], ref });
}) as ComponentType<ViewProps>;

export const TFoot = forwardRef((props: ViewProps, ref) => {
  return createElement('tfoot', { ...props, style: [styles.reset, props.style], ref });
}) as ComponentType<ViewProps>;

export const TH = forwardRef((props: TableTextProps, ref) => {
  return createElement('th', { ...props, style: [styles.reset, props.style], ref });
}) as ComponentType<TableTextProps>;

export const TR = forwardRef((props: ViewProps, ref) => {
  return createElement('tr', { ...props, style: [styles.reset, props.style], ref });
}) as ComponentType<ViewProps>;

export const TD = forwardRef((props: TableTextProps, ref) => {
  return createElement('td', { ...props, style: [styles.reset, props.style], ref });
}) as ComponentType<TableTextProps>;

export const Caption = forwardRef((props: TextProps, ref) => {
  return createElement('caption', { ...props, style: [styles.reset, props.style], ref });
}) as ComponentType<TextProps>;

const styles = StyleSheet.create({
  reset: {
    fontFamily: 'System',
    padding: 0,
  },
});
