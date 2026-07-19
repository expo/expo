import { GoogleMaps } from 'expo-maps';
import { View } from 'react-native';

export default function MapsMapStyleOptionsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <GoogleMaps.View
        style={{ width: 'auto', height: '100%' }}
        properties={{
          mapStyleOptions: {
            json: mapStyleOptionsJson,
          },
        }}
        cameraPosition={{
          coordinates: {
            latitude: 47.608597,
            longitude: -122.504604,
          },
          zoom: 10,
        }}
      />
    </View>
  );
}

const mapStyleOptionsJson = `
[
  {
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.neighborhood",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  }
]`;
