import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import rem from './rem';

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
    marginBottom: rem(0.5),
  },
  bullet: {
    position: 'absolute',
    left: 6,
    top: rem(0.65625),
    marginTop: -2,
    height: 4,
    width: 4,
    backgroundColor: 'black',
    borderRadius: 50,
  },
});

export default TextList;
