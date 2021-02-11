import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import Colors from '../constants/Colors';

export default () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.light.tint} />
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    minHeight: 200,
    padding: 50,
  },
});
