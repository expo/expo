/* eslint-disable react/prop-types */

import AppText from './AppText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const TextList = ({ items }) => (
  <View accessibilityTraits="list" style={styles.list}>
    {items.map((item, i) => (
      <AppText accessibilityTraits="listitem" key={i} style={styles.item}>
        <View style={styles.bullet} />
        {item}
      </AppText>
    ))}
  </View>
);

const styles = StyleSheet.create({
  item: {
    position: 'relative',
    paddingLeft: 20,
    marginBottom: '0.5rem'
  },
  bullet: {
    position: 'absolute',
    left: 6,
    top: '.65625rem',
    marginTop: -2,
    height: 4,
    width: 4,
    backgroundColor: 'black',
    borderRadius: 50
  }
});

export default TextList;
