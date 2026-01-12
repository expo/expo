import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { installOnUIRuntime } from 'expo';
import { runOnJS, runOnUI } from 'react-native-worklets';
import 'react-native-reanimated';

installOnUIRuntime();

export default function WorkletsInitScreen() {
  const [isExpoObjectAvailable, setIsExpoObjectAvailable] = useState(false);
  const [isEventEmitterAvailable, setIsEventEmitterAvailable] = useState(false);
  const [isNativeModuleAvailable, setIsNativeModuleAvailable] = useState(false);

  useEffect(() => {
    runOnUI(() => {
      runOnJS(setIsExpoObjectAvailable)(!!globalThis.expo);
      runOnJS(setIsEventEmitterAvailable)(!!globalThis.expo?.EventEmitter);
      runOnJS(setIsNativeModuleAvailable)(!!globalThis.expo?.NativeModule);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Worklets UI Runtime Status</Text>
      </View>

      <StatusRow label="Expo object" available={isExpoObjectAvailable} />
      <StatusRow label="EventEmitter" available={isEventEmitterAvailable} />
      <StatusRow label="NativeModule" available={isNativeModuleAvailable} />
    </View>
  );
}

function StatusRow({ label, available }: { label: string; available: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <View style={[styles.status, available ? styles.statusAvailable : styles.statusUnavailable]}>
        <Text style={styles.statusText}>{available ? '✓ Available' : '✗ Unavailable'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusAvailable: {
    backgroundColor: '#d4edda',
  },
  statusUnavailable: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
