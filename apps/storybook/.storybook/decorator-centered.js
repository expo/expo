import React from 'react';
import { StyleSheet, View } from 'react-native';
import rem from '../stories/ui-explorer/rem';

const styles = StyleSheet.create({
  root: {
    minHeight: '100vh',
    maxWidth: 680,
    marginHorizontal: 'auto',
    padding: rem(1),
  },
});

export default function(renderStory) {
  return <View style={styles.root}>{renderStory()}</View>;
}
