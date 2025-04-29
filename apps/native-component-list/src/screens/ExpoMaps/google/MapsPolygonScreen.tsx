import { GoogleMaps } from 'expo-maps';
import { Alert, View } from 'react-native';

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
        onPolygonClick={(event) => {
          console.log(event);
          Alert.alert('Polygon clicked', JSON.stringify(event));
        }}
        polygons={[
          {
            color: '#ff0000',
            lineWidth: 60,
            coordinates: [
              {
                latitude: 46.3346775,
                longitude: 16.5689839,
              },
              {
                latitude: 46.3322329,
                longitude: 16.5677608,
              },
              {
                latitude: 46.3314032,
                longitude: 16.5735759,
              },
              {
                latitude: 46.3340404,
                longitude: 16.5749921,
              },
              {
                latitude: 46.334635,
                longitude: 16.5689818,
              },
              {
                latitude: 46.3346775,
                longitude: 16.5689839,
              },
            ],
          },
        ]}
      />
    </View>
  );
}
