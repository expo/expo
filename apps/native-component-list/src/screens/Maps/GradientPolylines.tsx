import React from 'react';
import {StyleSheet, Dimensions} from 'react-native';

import MapView, {Polyline} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const COORDINATES = [
  {latitude: 37.8025259, longitude: -122.4351431},
  {latitude: 37.7896386, longitude: -122.421646},
  {latitude: 37.7665248, longitude: -122.4161628},
  {latitude: 37.7734153, longitude: -122.4577787},
  {latitude: 37.7948605, longitude: -122.4596065},
  {latitude: 37.8025259, longitude: -122.4351431},
];

const COLORS = [
  '#7F0000',
  '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
  '#B24112',
  '#E5845C',
  '#238C23',
  '#7F0000',
];

class GradientPolylines extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      coordinates: [],
    };
    this.setState({coordinates: COORDINATES});
  }

  render() {
    return (
      <MapView
        googleRenderer={'LEGACY'}
        provider={this.props.provider}
        style={styles.container}
        initialRegion={this.state.region}>
        <Polyline
          coordinates={this.state.coordinates}
          strokeColor="#000"
          strokeColors={COLORS}
          strokeWidth={6}
        />
      </MapView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default GradientPolylines;
