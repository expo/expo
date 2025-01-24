import { useImage } from 'expo-image';
import { GoogleMaps } from 'expo-maps-remake';
import { View } from 'react-native';

export default function MapsCameraControlsScreen() {
  const image = useImage('https://picsum.photos/128', {
    onError(error) {
      console.error(error);
    },
  });

  const coordinates = {
    latitude: 49.246292,
    longitude: -123.116226,
  };
  const markers = image ? [{ title: 'Vancouver', coordinates, icon: image }] : [];

  return (
    <View style={{ flex: 1 }}>
      <GoogleMaps.View
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          zoom: 10,
          coordinates,
        }}
        markers={markers}
      />
    </View>
  );
}
