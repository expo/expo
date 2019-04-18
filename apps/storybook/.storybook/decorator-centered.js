import React from 'react';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  root: {
    minHeight: '100vh',
    maxWidth: 680,
    marginHorizontal: 'auto'
  }
});

export default function(renderStory) {
  return <View style={styles.root}>{renderStory()}</View>;
}
