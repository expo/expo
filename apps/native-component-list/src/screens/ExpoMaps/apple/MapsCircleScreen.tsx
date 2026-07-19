import { AppleMaps } from 'expo-maps';
import { Alert, View } from 'react-native';

export default function MapsCircleScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AppleMaps.View
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          coordinates: {
            latitude: 46.334295,
            longitude: 16.5656,
          },
          zoom: 15,
        }}
        onCircleClick={(event) => {
          console.log(event);
          Alert.alert('Circle clicked', JSON.stringify(event));
        }}
        circles={[
          {
            color: '#00ff00',
            center: {
              latitude: 46.334295,
              longitude: 16.5656,
            },
            radius: 300,
          },
        ]}
      />
    </View>
  );
}
