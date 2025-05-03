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
            longitude: 16.572,
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
            lineColor: '#0000ff',
            lineWidth: 30,
            coordinates: [
              {
                latitude: 46.3338841,
                longitude: 16.5705478,
              },
              {
                latitude: 46.332121,
                longitude: 16.5704298,
              },
              {
                latitude: 46.3312468,
                longitude: 16.5723395,
              },
              {
                latitude: 46.3319062,
                longitude: 16.5742815,
              },
              {
                latitude: 46.3336989,
                longitude: 16.5744746,
              },
              {
                latitude: 46.3344248,
                longitude: 16.5725756,
              },
              {
                latitude: 46.3338915,
                longitude: 16.5705264,
              },
              {
                latitude: 46.3338841,
                longitude: 16.5705478,
              },
            ],
          },
        ]}
      />
    </View>
  );
}
