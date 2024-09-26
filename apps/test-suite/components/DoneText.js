import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import Colors from '../constants/Colors';

export default function DoneText({ done, numFailed, results }) {
  return (
    <View testID="test_suite_results" style={styles.container}>
      {!done && (
        <View style={styles.messageContainer}>
          <ActivityIndicator />
          <Text testID="test_suite_loading_results" style={styles.doneMessage}>
            Running Tests...
          </Text>
        </View>
      )}
      {done && (
        <View style={styles.messageContainer}>
          <Text style={styles.doneMessage}>Complete.</Text>
          {numFailed ? (
            <Text
              testID="test_suite_text_results"
              style={[styles.doneMessage, { color: Colors.failed }]}>
              {numFailed}
              {numFailed === 1 ? ' test' : ' tests'} failed!
            </Text>
          ) : (
            <Text
              testID="test_suite_text_results"
              style={[styles.doneMessage, { color: Colors.passed }]}>
              Success!
            </Text>
          )}
        </View>
      )}
      {done && (
        <Text style={styles.finalResults} pointerEvents="none" testID="test_suite_final_results">
          {results}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  finalResults: {
    // Hide text for e2e tests to read
    position: 'absolute',
    opacity: 0,
  },
  doneMessage: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    minHeight: 28,
  },
});
