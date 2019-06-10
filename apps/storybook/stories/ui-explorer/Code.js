import { createElement, StyleSheet } from 'react-native';

const Code = props => createElement('code', { ...props, style: [styles.code, props.style] });

export default Code;

const styles = StyleSheet.create({
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22.4,
    whiteSpace: 'pre',
    color: 'rgba(0, 0, 32, 0.9)',
    backgroundColor: '#F8F8F8',
    borderRadius: 3,
    marginHorizontal: 2,
    paddingHorizontal: 5,
    whiteSpace: 'nowrap',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#EEEEEE',
  },
});
