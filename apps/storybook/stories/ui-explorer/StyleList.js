import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppText from './AppText';
import rem from './rem';

const StyleList = ({ stylePropTypes }) => (
  <View accessibilityTraits="list">
    {stylePropTypes.map(({ label, name, typeInfo }, i) => (
      <AppText accessibilityTraits="listitem" key={i} style={styles.item}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Text style={styles.name}>{name}</Text>
        {typeInfo ? ': ' : null}
        {typeInfo ? <Text style={styles.code}>{typeInfo}</Text> : null}
      </AppText>
    ))}
  </View>
);

const styles = StyleSheet.create({
  code: {
    fontFamily: 'monospace, monospace',
    lineHeight: rem(1.3125),
  },
  item: {
    fontSize: rem(0.85),
    marginLeft: 20,
    marginBottom: rem(0.5),
  },
  name: {
    fontWeight: 'bold',
  },
  title: {
    fontSize: rem(2),
  },
  label: {
    borderRadius: rem(1),
    paddingVertical: rem(0.125),
    paddingHorizontal: rem(0.5),
    marginRight: rem(0.5),
    backgroundColor: '#bdebff',
    color: '#025268',
  },
});

export default StyleList;
