import React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';

import MapView from 'react-native-maps';
import XMarksTheSpot from './CustomOverlayXMarksTheSpot';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

class CustomOverlay extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      coordinates: [
        {
          longitude: -122.442753,
          latitude: 37.79879,
        },
        {
          longitude: -122.424728,
          latitude: 37.801232,
        },
        {
          longitude: -122.422497,
          latitude: 37.790651,
        },
        {
          longitude: -122.440693,
          latitude: 37.788209,
        },
      ],
      center: {
        longitude: -122.4326648935676,
        latitude: 37.79418561114521,
      },
    };
  }

  render() {
    const {coordinates, center, region} = this.state;
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          initialRegion={region}>
          <XMarksTheSpot coordinates={coordinates} center={center} />
        </MapView>
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
});

export default CustomOverlay;
