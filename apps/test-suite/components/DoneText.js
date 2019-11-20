import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DoneText({ done, numFailed, results }) {
  if (!done) {
    return null;
  }
  return (
    <View testID="test_suite_results">
      <Text testID="test_suite_text_results" style={styles.doneMessage}>
        All done! {numFailed}
        {numFailed === 1 ? ' test' : ' tests'} failed.
      </Text>
      <Text style={styles.finalResults} pointerEvents="none" testID="test_suite_final_results">
        {results}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  finalResults: {
    position: 'absolute',
    opacity: 0,
  },
  doneMessage: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
