import { Picker } from '@react-native-picker/picker';
import { GoogleMaps } from 'expo-maps';
import { useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

const cameraCoordinates = [
  {
    latitude: 40.9971,
    longitude: 29.1007,
  },
  {
    latitude: 37.78825,
    longitude: -122.4324,
  },
];

export default function MapsCameraControlsScreen() {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(1);

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <GoogleMaps.StreetView
          style={{ width: 'auto', height: '100%' }}
          position={cameraCoordinates[currentSourceIndex - 1]}
        />
      </View>
      <Picker
        itemStyle={Platform.OS === 'ios' && { height: 150 }}
        style={styles.picker}
        mode="dropdown"
        selectedValue={currentSourceIndex}
        onValueChange={(value: number) => {
          console.log(value);
          setCurrentSourceIndex(value);
        }}>
        {cameraCoordinates.map((_, index) => (
          <Picker.Item key={index + 1} label={`Location #${index}`} value={index + 1} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: 'auto',
    height: '100%',
  },
  picker: {
    alignSelf: 'stretch',
    backgroundColor: '#e0e0e0',
  },
  zoomContainer: {
    padding: 10,
  },
});
