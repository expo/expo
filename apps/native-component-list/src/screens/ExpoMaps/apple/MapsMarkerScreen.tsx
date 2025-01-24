import { AppleMaps } from 'expo-maps';
import { View } from 'react-native';

export default function MapsCameraControlsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AppleMaps.View
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          coordinates: {
            latitude: 50,
            longitude: 10,
          },
          zoom: 3,
        }}
        markers={[
          {
            coordinates: { latitude: 50, longitude: 10 },
            title: 'Marker #1',
            tintColor: 'blue',
            systemImage: 'pin',
          },
          {
            coordinates: { latitude: 51, longitude: 9 },
            title: 'Marker #2',
            tintColor: 'green',
            systemImage: 'person',
          },
          {
            coordinates: { latitude: 49, longitude: 11 },
            title: 'Marker #3',
            tintColor: 'black',
            systemImage: 'arrowshape.up.circle',
          },
          {
            coordinates: { latitude: 51, longitude: 10 },
            title: 'Marker #4',
            tintColor: 'purple',
            systemImage: 'play.circle',
          },
          {
            coordinates: { latitude: 49, longitude: 9 },
            title: 'Marker #4',
            tintColor: 'orange',
            systemImage: 'figure.walk.circle',
          },
        ]}
      />
    </View>
  );
}
