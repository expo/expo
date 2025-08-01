import { GoogleMaps } from 'expo-maps';
import { View } from 'react-native';

export default function MapsMapIdScreen() {
  return (
    <View style={{ flex: 1 }}>
      <GoogleMaps.View
        style={{ width: 'auto', height: '100%' }}
        mapOptions={{
          mapId: 'b176a543d17e3d539ddd199c',
        }}
        cameraPosition={{
          coordinates: {
            latitude: 23.0225,
            longitude: 72.5714,
          },
          zoom: 1,
        }}
      />
    </View>
  );
}
