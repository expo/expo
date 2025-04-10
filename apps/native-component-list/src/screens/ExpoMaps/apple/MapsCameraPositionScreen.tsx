import { AppleMaps } from 'expo-maps';
import { useRef } from 'react';
import { Button, StyleSheet, View } from 'react-native';

export default function MapsCameraPositionScreen() {
  const ref = useRef<AppleMaps.MapView>(null);

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <AppleMaps.View
          ref={ref}
          style={{ width: 'auto', height: '100%' }}
          cameraPosition={{
            coordinates: {
              latitude: 37.78825,
              longitude: -122.4324,
            },
            zoom: 15,
          }}
        />
      </View>

      <View style={styles.configurator}>
        <Button title="Set empty" onPress={() => ref.current?.setCameraPosition()} />
        <Button
          title="Set 0, 0"
          onPress={() =>
            ref.current?.setCameraPosition({ coordinates: { latitude: 0, longitude: 0 } })
          }
        />
        <Button
          title="Set random"
          onPress={() =>
            ref.current?.setCameraPosition({
              coordinates: {
                latitude: Math.random() * 360 - 180,
                longitude: Math.random() * 360 - 180,
              },
              zoom: Math.random() * 20,
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  configurator: {
    paddingHorizontal: 15,
  },
});
