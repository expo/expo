import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import MapView, { Polyline, LatLng, Provider } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const COORDINATES = [
  { latitude: 37.8025259, longitude: -122.4351431 },
  { latitude: 37.7896386, longitude: -122.421646 },
  { latitude: 37.7665248, longitude: -122.4161628 },
  { latitude: 37.7734153, longitude: -122.4577787 },
  { latitude: 37.7948605, longitude: -122.4596065 },
  { latitude: 37.8025259, longitude: -122.4351431 },
];

const COLORS = [
  '#7F0000',
  '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
  '#B24112',
  '#E5845C',
  '#238C23',
  '#7F0000',
];

export type GradientPolylinesFunctionalProps = {
  provider: Provider;
};

const GradientPolylines = (props: GradientPolylinesFunctionalProps) => {
  const [region] = useState({
    latitude: LATITUDE,
    longitude: LONGITUDE,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  const [polylineSteps, setPolylineSteps] = useState<LatLng[]>([]);

  useEffect(() => setPolylineSteps(COORDINATES), []);

  return (
    <MapView
      provider={props.provider}
      style={styles.container}
      initialRegion={region}
      showsUserLocation>
      <Polyline
        coordinates={polylineSteps}
        strokeColor="#000"
        strokeColors={COLORS}
        strokeWidth={6}
      />
    </MapView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default GradientPolylines;
