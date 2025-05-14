import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Alert } from 'react-native';
import MapView, { LatLng, MapPressEvent, Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6)}`;
}

const DefaultMarkers = (props: any) => {
  const region = useRef({
    latitude: LATITUDE,
    longitude: LONGITUDE,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  const [markers, setMarkers] = useState<{ coordinate: LatLng; key: string; color: string }[]>([]);

  const onMapPress = (e: LatLng) => {
    setMarkers((p) => [
      ...p,
      {
        coordinate: {
          latitude: e.latitude,
          longitude: e.longitude,
        },
        key: markers.length.toString(),
        color: randomColor(),
      },
    ]);
    console.log('Added marker. Number of markers:', markers.length + 1);
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={props.provider}
        style={styles.map}
        initialRegion={region.current}
        poiClickEnabled={false}
        onPress={(e) => onMapPress(e.nativeEvent.coordinate)}>
        {markers.map((marker: any) => (
          <Marker
            key={marker.key}
            coordinate={marker.coordinate}
            pinColor={marker.color}
            onPress={(evt) => {
              const nextMarkers = markers.filter((m) => m.key !== marker.key);
              setMarkers(nextMarkers);
              evt.preventDefault();
              evt.stopPropagation();
            }}
          />
        ))}
      </MapView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => setMarkers([])} style={styles.bubble}>
          <Text>Tap map to create a marker of random color</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  latlng: {
    width: 200,
    alignItems: 'stretch',
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});

export default DefaultMarkers;
