import React from 'react';
import { StyleSheet } from 'react-native';

import { em } from '../css/units';
import { TableText, TableTextProps } from '../primitives/Table';
import Text, { TextProps } from '../primitives/Text';
import View, { ViewProps } from '../primitives/View';

export function Table(props: ViewProps) {
  return <View {...props} />;
}

export function THead(props: ViewProps) {
  return <View {...props} />;
}

export function TBody(props: ViewProps) {
  return <View {...props} />;
}

export function TFoot(props: ViewProps) {
  return <View {...props} />;
}

export function TH(props: TableTextProps) {
  return <TableText {...props} style={[styles.th, props.style]} />;
}

export function TR(props: ViewProps) {
  return <View {...props} style={[styles.tr, props.style]} />;
}

export function TD(props: TableTextProps) {
  return <TableText {...props} style={[styles.td, props.style]} />;
}

export function Caption(props: TextProps) {
  return <Text {...props} style={[styles.caption, props.style]} />;
}

const styles = StyleSheet.create({
  caption: {
    textAlign: 'center',
    fontSize: em(1) as number,
  },
  th: {
    textAlign: 'center',
    fontWeight: 'bold',
    flex: 1,
    fontSize: em(1) as number,
  },
  tr: {
    flexDirection: 'row',
  },
  td: {
    flex: 1,
    fontSize: em(1) as number,
  },
});
