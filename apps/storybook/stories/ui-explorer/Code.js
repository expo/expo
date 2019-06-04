import { createElement, StyleSheet } from 'react-native';
import rem from './rem';

const Code = props => createElement('code', { ...props, style: [styles.code, props.style] });

export default Code;

const styles = StyleSheet.create({
  code: {
    fontFamily: 'monospace, monospace',
    fontSize: rem(1),
    lineHeight: rem(1.3125),
    whiteSpace: 'pre',
  },
});
