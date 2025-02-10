import { AppleMaps } from 'expo-maps';
import { View } from 'react-native';

export default function MapsCameraControlsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AppleMaps.View
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
