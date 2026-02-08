import { installOnUIRuntime } from 'expo';
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { runOnJS } from 'react-native-worklets';
import 'react-native-reanimated';
import { WorkletsTester, WorkletsTesterView } from 'worklets-tester';

installOnUIRuntime();

type TestResult = {
  name: string;
  success: boolean;
  message: string;
};

export default function WorkletsTesterScreen() {
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (result: TestResult) => {
    setResults((prev) => [result, ...prev]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testExecuteWorklet = () => {
    try {
      WorkletsTester.executeWorklet(() => {
        'worklet';
        runOnJS(addResult)({
          name: 'executeWorklet',
          success: true,
          message: 'Worklet executed synchronously on UI runtime',
        });
      });
    } catch (error) {
      addResult({
        name: 'executeWorklet',
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const testScheduleWorklet = () => {
    try {
      WorkletsTester.scheduleWorklet(() => {
        'worklet';
        runOnJS(addResult)({
          name: 'scheduleWorklet',
          success: true,
          message: 'Worklet scheduled and executed on UI runtime',
        });
      });
    } catch (error) {
      addResult({
        name: 'scheduleWorklet',
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const testExecuteWorkletWithArgs = () => {
    try {
      WorkletsTester.executeWorkletWithArgs((num, str, bool) => {
        'worklet';
        runOnJS(addResult)({
          name: 'executeWorkletWithArgs',
          success: true,
          message: `Received args - Number: ${num}, String: ${str}, Boolean: ${bool}`,
        });
      });
    } catch (error) {
      addResult({
        name: 'executeWorkletWithArgs',
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const testScheduleWorkletWithArgs = () => {
    try {
      WorkletsTester.scheduleWorkletWithArgs((num, str, bool) => {
        'worklet';
        runOnJS(addResult)({
          name: 'scheduleWorkletWithArgs',
          success: true,
          message: `Received args - Number: ${num}, String: ${str}, Boolean: ${bool}`,
        });
      });
    } catch (error) {
      addResult({
        name: 'scheduleWorkletWithArgs',
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testExecuteWorklet}>
          <Text style={styles.buttonText}>Test executeWorklet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testScheduleWorklet}>
          <Text style={styles.buttonText}>Test scheduleWorklet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testExecuteWorkletWithArgs}>
          <Text style={styles.buttonText}>Test executeWorkletWithArgs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testScheduleWorkletWithArgs}>
          <Text style={styles.buttonText}>Test scheduleWorkletWithArgs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.resultsTitle}>Worklet Callback View:</Text>
      {Platform.OS === 'ios' ? (
        <WorkletsTesterView
          style={styles.nativeView}
          onPressSync={(message: string) => {
            'worklet';
            runOnJS(addResult)({
              name: 'workletCallback',
              success: true,
              message: `Callback from native view: ${message}`,
            });
          }}
        />
      ) : (
        <Text style={styles.noResults}>
          Worklet Callback View is not supported on this platform
        </Text>
      )}

      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>Results:</Text>
        {results.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet</Text>
        ) : (
          results.map((result, index) => (
            <View
              key={index}
              style={[styles.resultRow, result.success ? styles.successRow : styles.errorRow]}>
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#666',
  },
  nativeView: {
    height: 50,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsSection: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  resultRow: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  successRow: {
    backgroundColor: '#d4edda',
  },
  errorRow: {
    backgroundColor: '#f8d7da',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 12,
    color: '#666',
  },
});
