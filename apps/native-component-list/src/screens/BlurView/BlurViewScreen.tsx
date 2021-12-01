import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import BlurViewWithControls from './BlurViewWithControls';

export default function BlurViewScreen() {
  return (
    <ScrollView style={styles.container}>
      {(['default', 'light', 'dark'] as const).map((tint) => (
        <BlurViewWithControls key={tint} tint={tint} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
