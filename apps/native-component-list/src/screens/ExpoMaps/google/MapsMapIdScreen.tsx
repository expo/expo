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
            latitude: 23.0225,
            longitude: 72.5714,
          },
          zoom: 1,
        }}
      />
    </View>
  );
}
