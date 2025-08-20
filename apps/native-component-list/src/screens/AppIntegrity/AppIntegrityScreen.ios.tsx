import * as AppIntegrity from '@expo/app-integrity';
import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';

export default function AppIntegrityIOSScreen() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testGenerateKey = async () => {
    setIsLoading(true);
    try {
      const key = await AppIntegrity.generateKey();
      addResult(`generateKey: Success (key: ${key})`);
    } catch (error) {
      addResult(`generateKey error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAttestKey = async () => {
    setIsLoading(true);
    try {
      const key = await AppIntegrity.generateKey();
      addResult(`Generated key: ${key}`);
      const challenge = 'test-challenge-' + Date.now();
      const attestation = await AppIntegrity.attestKey(key, challenge);
      addResult(`attestKey: Success (attestation length: ${attestation.length})`);
    } catch (error) {
      addResult(`attestKey error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGenerateAssertion = async () => {
    setIsLoading(true);
    try {
      const key = await AppIntegrity.generateKey();
      addResult(`Generated key: ${key}`);
      const challenge = 'test-challenge-' + Date.now();
      const assertion = await AppIntegrity.generateAssertion(key, challenge);
      addResult(`generateAssertion: Success (assertion length: ${assertion.length})`);
    } catch (error) {
      addResult(`generateAssertion error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullFlow = async () => {
    setIsLoading(true);
    try {
      const key = await AppIntegrity.generateKey();
      addResult(`generateKey: Success (key: ${key})`);
      const challenge = 'test-challenge-' + Date.now();
      const attestation = await AppIntegrity.attestKey(key, challenge);
      addResult(`attestKey: Success (attestation length: ${attestation.length})`);
      const challengeData = JSON.stringify({ timestamp: Date.now(), test: true });
      const assertion = await AppIntegrity.generateAssertion(key, challengeData);
      addResult(`generateAssertion: Success (assertion length: ${assertion.length})`);
    } catch (error) {
      addResult(`Full flow error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>iOS App Integrity Test</Text>
        <Text style={styles.subtitle}>Uses DeviceCheck App Attest API</Text>
        <Text style={styles.subtitle}>isSupported: {AppIntegrity.isSupported.toString()}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={testGenerateKey} disabled={isLoading}>
          <Text style={styles.buttonText}>Test generateKey</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={testAttestKey} disabled={isLoading}>
          <Text style={styles.buttonText}>Test attestKey</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={testGenerateAssertion} disabled={isLoading}>
          <Text style={styles.buttonText}>Test generateAssertion</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={testFullFlow} disabled={isLoading}>
          <Text style={styles.buttonText}>Test Full Flow</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </Pressable>
      </View>

      <View style={styles.resultsContainer}>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Text style={styles.resultsTitle}>Results:</Text>
          {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
        </View>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
        {results.length === 0 && (
          <Text style={styles.noResults}>No results yet. Run a test to see output.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  platformWarning: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
