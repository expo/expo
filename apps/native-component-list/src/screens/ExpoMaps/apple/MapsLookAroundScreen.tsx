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
              latitude: 37.332753,
              longitude: -122.005372,
            },
            zoom: 15,
          }}
        />
      </View>

      <View style={styles.configurator}>
        <Button
          title="Open look around"
          onPress={async () => {
            try {
              await ref.current?.openLookAroundAsync({
                latitude: 37.332753,
                longitude: -122.005372,
              });
            } catch (error) {
              console.error(error);
            }
          }}
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
