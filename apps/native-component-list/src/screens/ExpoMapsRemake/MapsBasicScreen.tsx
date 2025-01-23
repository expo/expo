import { ExpoMapsView } from 'expo-maps-remake';
import { View } from 'react-native';

export default function MapsCameraControlsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ExpoMapsView
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          zoom: 1,
        }}
      />
    </View>
  );
}
