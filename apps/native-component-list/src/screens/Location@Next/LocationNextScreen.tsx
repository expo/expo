import * as LocationNext from 'expo-location/next';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import Button from '../../components/Button';
import { setLocationTaskListener } from './locationTask';

export default function LocationNextScreen() {
  const [output, setOutput] = useState('No output yet');
  const watcher = useRef<LocationNext.PositionWatchHandle | null>(null);
  const updates = useRef(new LocationNext.LocationUpdatesHandle()).current;

  useEffect(() => {
    setLocationTaskListener((message) => setOutput(`[task] ${message}`));
    return () => {
      setLocationTaskListener(null);
      watcher.current?.dispose();
      watcher.current = null;
    };
  }, []);

  const run = (label: string, action: () => Promise<unknown>) => async () => {
    try {
      const result = await action();
      setOutput(`[${label}] ${result === undefined ? 'done' : JSON.stringify(result, null, 2)}`);
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button
        title="getForegroundPermissions"
        onPress={run('permissions', LocationNext.getForegroundPermissionsAsync)}
      />
      <Button
        title="requestForegroundPermissions"
        onPress={run('permissions', () => LocationNext.requestForegroundPermissionsAsync())}
      />
      <Button
        title="getBackgroundPermissions"
        onPress={run('permissions', LocationNext.getBackgroundPermissionsAsync)}
      />
      <Button
        title="requestBackgroundPermissions"
        onPress={run('permissions', LocationNext.requestBackgroundPermissionsAsync)}
      />
      <Button
        title="getPosition"
        onPress={run('position', () =>
          LocationNext.getPosition({ profile: LocationNext.LocationProfile.DEFAULT })
        )}
      />
      <Button
        title="watchPosition"
        onPress={run('watcher', async () => {
          watcher.current?.dispose();
          watcher.current = null;
          watcher.current = LocationNext.watchPosition({
            onPosition: (position) => setOutput(`[watcher] ${JSON.stringify(position, null, 2)}`),
            onError: (error) => setOutput(`[watcher] ${error}`),
          });
        })}
      />
      <Button
        title="watcher.pause"
        onPress={run('watcher', async () => watcher.current?.pause())}
      />
      <Button
        title="watcher.resume"
        onPress={run('watcher', async () => watcher.current?.resume())}
      />
      <Button
        title="watcher.status"
        onPress={run('watcher', async () => watcher.current?.status())}
      />
      <Button title="updates.start" onPress={run('updates', () => updates.start())} />
      <Button title="updates.stop" onPress={run('updates', () => updates.stop())} />
      <Text style={{ marginTop: 16 }}>{output}</Text>
    </View>
  );
}
