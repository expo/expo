import { AppleMaps } from 'expo-maps-remake';
import { View, StyleSheet } from 'react-native';

export default function MapsAnnotationsScreen() {
  return (
    <View style={styles.container}>
      <AppleMaps.View
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          coordinates: {
            latitude: 51.509865,
            longitude: -0.1275,
          },
          zoom: 1,
        }}
        annotations={[
          {
            coordinates: { latitude: 51.38494, longitude: -0.41944 },
            title: 'Windsor',
            text: 'This is a test',
            textColor: 'white',
            backgroundColor: 'red',
          },
          {
            coordinates: { latitude: 51.454514, longitude: -0.97813 },
            title: 'Reading',
            text: 'This is a test',
            textColor: 'white',
            backgroundColor: 'green',
          },
          {
            coordinates: { latitude: 51.280233, longitude: 1.080775 },
            title: 'Canterbury',
            text: 'This is a test',
            textColor: 'white',
            backgroundColor: 'blue',
          },
          {
            coordinates: { latitude: 51.75, longitude: -1.257778 },
            title: 'Oxford',
            text: 'This is a test',
            textColor: 'black',
            backgroundColor: 'yellow',
          },
          {
            coordinates: { latitude: 51.509865, longitude: -0.118092 },
            title: 'Westminster',
            text: 'This is a test',
            textColor: 'white',
            backgroundColor: 'purple',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
