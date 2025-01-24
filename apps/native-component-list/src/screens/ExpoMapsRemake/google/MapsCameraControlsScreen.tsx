import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { GoogleMaps } from 'expo-maps-remake';
import { useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';

const cameraCoordinates = [
  {
    latitude: 9.40816,
    longitude: 14.59192,
  },
  {
    latitude: 25.29119,
    longitude: 65.30384,
  },
  {
    latitude: -12.82035,
    longitude: -55.55456,
  },
  {
    latitude: 37.78825,
    longitude: -122.4324,
  },
];
export default function MapsBasicScreen() {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(1);
  const [zoom, setZoom] = useState(1);
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <GoogleMaps.View
          style={styles.map}
          cameraPosition={{
            coordinates: cameraCoordinates[currentSourceIndex - 1],
            zoom,
          }}
          properties={{
            maxZoomPreference: 20,
            minZoomPreference: 1,
          }}
        />
      </View>
      <Picker
        itemStyle={Platform.OS === 'ios' && { height: 150 }}
        style={styles.picker}
        mode="dropdown"
        selectedValue={currentSourceIndex}
        onValueChange={(value: number) => {
          setCurrentSourceIndex(value);
        }}>
        {cameraCoordinates.map((_, index) => (
          <Picker.Item key={index + 1} label={`Location #${index}`} value={index + 1} />
        ))}
      </Picker>
      <View style={styles.zoomContainer}>
        <Text>Zoom level: {zoom}</Text>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={0.1}
          onValueChange={(v) => setZoom(parseFloat(v.toFixed(1)))}
        />
      </View>
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
