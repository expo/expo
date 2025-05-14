import React, {Component} from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';

import MapView, {Overlay} from 'react-native-maps';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 35.679976;
const LONGITUDE = 139.768458;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
// 116423, 51613, 17
const OVERLAY_TOP_LEFT_COORDINATE1 = [35.679609609368576, 139.76531982421875];
const OVERLAY_BOTTOM_RIGHT_COORDINATE1 = [35.68184060244454, 139.76806640625];
const IMAGE_URL1 = 'https://maps.gsi.go.jp/xyz/std/17/116423/51613.png';
// 116423, 51615, 17
const OVERLAY_TOP_LEFT_COORDINATE2 = [35.67514743608467, 139.76531982421875];
const OVERLAY_BOTTOM_RIGHT_COORDINATE2 = [35.67737855391474, 139.76806640625];
const IMAGE_URL2 = 'https://maps.gsi.go.jp/xyz/std/17/116423/51615.png';

export default class ImageOverlayWithBearing extends Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      overlay1: {
        bounds: [
          OVERLAY_TOP_LEFT_COORDINATE1,
          OVERLAY_BOTTOM_RIGHT_COORDINATE1,
        ],
        image: IMAGE_URL1,
      },
      overlay2: {
        bounds: [
          OVERLAY_TOP_LEFT_COORDINATE2,
          OVERLAY_BOTTOM_RIGHT_COORDINATE2,
        ],
        image: IMAGE_URL2,
      },
    };
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          initialRegion={this.state.region}>
          <Overlay
            bounds={this.state.overlay1.bounds}
            bearing={30}
            image={this.state.overlay1.image}
          />
          <Overlay
            bounds={this.state.overlay2.bounds}
            bearing={-30}
            image={this.state.overlay2.image}
          />
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
