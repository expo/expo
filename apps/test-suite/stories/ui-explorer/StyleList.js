/* eslint-disable react/prop-types */

import AppText from './AppText';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    lineHeight: '1.3125em'
  },
  item: {
    fontSize: '0.85rem',
    marginLeft: 20,
    marginBottom: '0.5rem'
  },
  name: {
    fontWeight: 'bold'
  },
  title: {
    fontSize: '2rem'
  },
  label: {
    borderRadius: '1rem',
    paddingVertical: '0.125rem',
    paddingHorizontal: '0.5rem',
    marginRight: '0.5rem',
    backgroundColor: '#bdebff',
    color: '#025268'
  }
});

export default StyleList;
