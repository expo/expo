import React from 'react';
import { StyleSheet, PixelRatio, View } from 'react-native';

import ListLink from './ListLink';

function MainOptions() {
  return (
    <View style={styles.group}>
      <ListLink route="Profile" label="Profile" glyphName="account" />
      <ListLink route="Settings" label="Settings" glyphName="settings-outline" />
    </View>
  );
}

const pixel = 2 / PixelRatio.get();
const styles = StyleSheet.create({
  group: {
    marginTop: 14,
    marginHorizontal: -pixel,
  },
});

export default MainOptions;
