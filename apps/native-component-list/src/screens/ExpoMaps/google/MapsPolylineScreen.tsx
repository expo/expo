import { GoogleMaps } from 'expo-maps';
import { Alert, View } from 'react-native';

import { polylineCoordinates } from '../data';

export default function MapsCameraControlsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <GoogleMaps.View
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          coordinates: {
            latitude: 46.334295,
            longitude: 16.5656,
          },
          zoom: 15,
        }}
        onPolylineClick={(event) => {
          console.log(event);
          Alert.alert('Polyline clicked', JSON.stringify(event));
        }}
        polylines={[
          {
            color: '#ff0000',
            width: 60,
            coordinates: polylineCoordinates,
          },
        ]}
      />
    </View>
  );
}
