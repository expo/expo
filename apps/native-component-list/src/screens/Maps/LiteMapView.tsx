import React from 'react';
import {StyleSheet, Dimensions, ScrollView} from 'react-native';

import MapView from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const SAMPLE_REGION = {
  latitude: LATITUDE,
  longitude: LONGITUDE,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

class LiteMapView extends React.Component {
  render() {
    const maps = [];
    for (let i = 0; i < 10; i++) {
      maps.push(
        <MapView
          liteMode
          key={`map_${i}`}
          style={styles.map}
          initialRegion={SAMPLE_REGION}
        />,
      );
    }
    return (
      <ScrollView style={StyleSheet.absoluteFillObject}>{maps}</ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  map: {
    height: 200,
    marginVertical: 50,
  },
});

export default LiteMapView;
