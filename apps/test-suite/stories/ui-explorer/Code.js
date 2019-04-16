/**
 * @flow
 */

import { createElement, StyleSheet } from 'react-native';

const Code = props => createElement('code', { ...props, style: [styles.code, props.style] });

export default Code;

const styles = StyleSheet.create({
  code: {
    fontFamily: 'monospace, monospace',
    fontSize: '1rem',
    lineHeight: '1.3125em',
    whiteSpace: 'pre'
  }
});
