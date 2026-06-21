import { Camera, type PermissionResponse } from 'expo-camera';
import * as React from 'react';
import { AppState, Button, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Manual harness for the Android `canAskAgain` fix (expo/expo#36883, #23805, #44180).
 *
 * Reach the "Ask every time" state and watch `canAskAgain`:
 *   1. Tap "Request" and choose "Only this time", then revoke from the notification or wait for the OS to revoke it.
 *   2. Or revoke from a terminal: `adb shell pm revoke dev.expo.payments android.permission.CAMERA`.
 *   3. Return to the app — the readout refreshes on resume.
 *
 * Before the fix `canAskAgain` reads `false` in that state; after the fix it reads `true`.
 */
export default function CameraPermissionsScreen() {
  const [response, setResponse] = React.useState<PermissionResponse | null>(null);

  const check = React.useCallback(async () => {
    setResponse(await Camera.getCameraPermissionsAsync());
  }, []);

  const request = React.useCallback(async () => {
    setResponse(await Camera.requestCameraPermissionsAsync());
  }, []);

  React.useEffect(() => {
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        check();
      }
    });
    return () => subscription.remove();
  }, [check]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>getCameraPermissionsAsync()</Text>
      <View style={styles.readout}>
        <Text style={styles.json}>{JSON.stringify(response, null, 2)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.field}>status</Text>
        <Text style={styles.value}>{response?.status ?? '—'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.field}>granted</Text>
        <Text style={styles.value}>{String(response?.granted ?? '—')}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.field}>canAskAgain</Text>
        <Text style={styles.value}>{String(response?.canAskAgain ?? '—')}</Text>
      </View>
      <View style={styles.buttons}>
        <Button title="Get (check)" onPress={check} />
        <Button title="Request (ask)" onPress={request} />
        <Button title="Open Settings" onPress={() => Linking.openSettings()} />
      </View>
    </ScrollView>
  );
}

CameraPermissionsScreen.navigationOptions = {
  title: 'Camera Permissions',
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  readout: {
    backgroundColor: '#11181c',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  json: {
    color: '#7ee787',
    fontFamily: 'Courier',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  field: {
    fontWeight: '600',
  },
  value: {
    fontFamily: 'Courier',
  },
  buttons: {
    marginTop: 24,
    gap: 12,
  },
});
