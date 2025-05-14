import React from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';

import MapView, {Marker} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.733858;
const LONGITUDE = -122.446549;
const MARKERS_LATITUDE_DELTA = 0.03;
const MARKERS_LONGITUDE_DELTA = MARKERS_LATITUDE_DELTA * ASPECT_RATIO;
const MAP_LATITUDE_DELTA = 0.3;
const MAP_LONGITUDE_DELTA = MAP_LATITUDE_DELTA * ASPECT_RATIO;
const NUM_MARKERS = 100;
const PERCENT_SPECIAL_MARKERS = 0.1;

class ZIndexMarkers extends React.Component<any, any> {
  map: any;
  constructor(props: any) {
    super(props);

    const markerInfo = [];
    for (let i = 1; i < NUM_MARKERS; i++) {
      markerInfo.push({
        latitude: (Math.random() * 2 - 1) * MARKERS_LATITUDE_DELTA + LATITUDE,
        longitude:
          (Math.random() * 2 - 1) * MARKERS_LONGITUDE_DELTA + LONGITUDE,
        isSpecial: Math.random() < PERCENT_SPECIAL_MARKERS,
        id: i,
      });
    }

    this.state = {
      markerInfo,
    };
  }

  render() {
    const markers = this.state.markerInfo.map((markerInfo: any) => (
      <Marker
        coordinate={markerInfo}
        key={markerInfo.id}
        pinColor={markerInfo.isSpecial ? '#c5a620' : undefined}
        style={markerInfo.isSpecial ? styles.specialMarker : null}
      />
    ));

    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          ref={ref => {
            this.map = ref;
          }}
          style={styles.map}
          initialRegion={{
            latitude: LATITUDE,
            longitude: LONGITUDE,
            latitudeDelta: MAP_LATITUDE_DELTA,
            longitudeDelta: MAP_LONGITUDE_DELTA,
          }}>
          {markers}
        </MapView>
        <View style={styles.textContainer}>
          <Text>
            The yellow markers have a higher zIndex and appear above other
            markers.
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  textContainer: {
    backgroundColor: 'white',
    borderRadius: 4,
    marginHorizontal: 40,
    marginVertical: 20,
    padding: 10,
  },
  specialMarker: {
    zIndex: 1,
  },
});

export default ZIndexMarkers;
