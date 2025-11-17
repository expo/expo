import * as AgeRange from 'expo-age-range';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

export default function AgeRangeScreen() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestAgeRange = async () => {
    setError(null);
    setResult(null);

    try {
      // Request age range with thresholds at 13, 16, and 18 years
      // These are common age gates for content restrictions
      const response = await AgeRange.requestAgeRangeAsync({
        threshold1: 13,
        threshold2: 16,
        threshold3: 18,
      });

      setResult(JSON.stringify(response, null, 2));
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  const faultyRequestAgeRange = async () => {
    setError(null);
    setResult(null);

    try {
      // interval too narrow
      const response = await AgeRange.requestAgeRangeAsync({
        threshold1: 10,
        threshold2: 11,
      });

      setResult(JSON.stringify(response, null, 2));
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', err.message || 'Unknown error occurred');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <HeadingText style={styles.heading}>Age Range API</HeadingText>

      <Text style={styles.description}>
        Request the user's age range with directly configurable (iOS) thresholds. This example uses
        thresholds at 13, 16, and 18 years old.
      </Text>

      {Platform.OS === 'ios' && (
        <Text style={styles.warning}>Note: This API requires iOS 26.0 or later.</Text>
      )}

      <Button onPress={requestAgeRange} title="Request Age Range" style={styles.button} />
      <Button
        onPress={faultyRequestAgeRange}
        title="Request Faulty Age Range"
        style={styles.button}
      />

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Result:</Text>
          <MonoText containerStyle={styles.resultText}>{result}</MonoText>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorLabel}>Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  contentContainer: {
    padding: 16,
  },
  heading: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 12,
    lineHeight: 20,
  },
  warning: {
    fontSize: 13,
    color: '#ff9500',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  button: {
    marginBottom: 20,
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.tintColor,
  },
  resultText: {
    fontSize: 12,
    borderWidth: 0,
  },
  errorContainer: {
    backgroundColor: '#ffe8e8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#cc0000',
  },
  errorText: {
    fontSize: 14,
    color: '#cc0000',
  },
});
