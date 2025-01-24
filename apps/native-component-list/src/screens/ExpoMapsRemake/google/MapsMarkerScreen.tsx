import { GoogleMaps } from 'expo-maps-remake';
import { View } from 'react-native';

export default function MapsCameraControlsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <GoogleMaps.View
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          coordinates: {
            latitude: 50,
            longitude: 10,
          },
          zoom: 7,
        }}
        markers={[
          {
            coordinates: { latitude: 50, longitude: 10 },
            title: 'Marker #1',
            snippet: 'You can drag me!',
            draggable: true,
          },
          {
            coordinates: { latitude: 51, longitude: 9 },
            title: 'Marker #2',
          },
          {
            coordinates: { latitude: 49, longitude: 11 },
            title: 'Marker #3',
          },
          {
            coordinates: { latitude: 51, longitude: 10 },
            title: 'Marker #4',
          },
          {
            coordinates: { latitude: 49, longitude: 9 },
            title: 'Marker #4',
          },
        ]}
      />
    </View>
  );
}
