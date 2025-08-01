import { GoogleMaps } from 'expo-maps';
import { View } from 'react-native';

export default function MapsCameraControlsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <GoogleMaps.View
        contentPadding={{
          start: 20,
          end: 20,
          bottom: 20,
        }}
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          coordinates: {
            latitude: 51.509865,
            longitude: -0.1275,
          },
          zoom: 1,
        }}
      />
    </View>
  );
}
