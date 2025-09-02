import { GoogleMaps } from 'expo-maps';
import { View } from 'react-native';

export default function MapsMapIdScreen() {
  return (
    <View style={{ flex: 1 }}>
      <GoogleMaps.View
        style={{ width: 'auto', height: '100%' }}
        mapOptions={{
          mapId: '108722dede205ddb1971ca68e87d',
        }}
        cameraPosition={{
          coordinates: {
            latitude: 47.608597,
            longitude: -122.504604,
          },
          zoom: 1,
        }}
      />
    </View>
  );
}
