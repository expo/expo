import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';

import MapView, {Marker} from 'react-native-maps';
import flagBlueImg from './assets/flag-blue.png';
import flagPinkImg from './assets/flag-pink.png';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const SPACE = 0.01;

class MarkerTypes extends React.Component<any, any> {
  map: any;
  constructor(props: any) {
    super(props);
    this.state = {
      mapSnapshot: null,
    };
  }

  takeSnapshot() {
    this.map.takeSnapshot(
      300,
      300,
      {
        latitude: LATITUDE - SPACE,
        longitude: LONGITUDE - SPACE,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01 * ASPECT_RATIO,
      },
      (err: any, data: any) => {
        if (err) {
          console.log(err);
        }
        this.setState({mapSnapshot: data});
      },
    );
  }

  render() {
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
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}>
          <Marker
            coordinate={{
              latitude: LATITUDE + SPACE,
              longitude: LONGITUDE + SPACE,
            }}
            centerOffset={{x: -18, y: -60}}
            anchor={{x: 0.69, y: 1}}
            image={flagBlueImg}
          />
          <Marker
            coordinate={{
              latitude: LATITUDE - SPACE,
              longitude: LONGITUDE - SPACE,
            }}
            centerOffset={{x: -42, y: -60}}
            anchor={{x: 0.84, y: 1}}
            image={flagPinkImg}
          />
        </MapView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => this.takeSnapshot()}
            style={[styles.bubble, styles.button]}>
            <Text>Take snapshot</Text>
          </TouchableOpacity>
        </View>
        {this.state.mapSnapshot && (
          <TouchableOpacity
            style={[styles.container, styles.overlay]}
            onPress={() => this.setState({mapSnapshot: null})}>
            <Image
              source={{uri: this.state.mapSnapshot.uri}}
              style={styles.mapSnapshot}
            />
          </TouchableOpacity>
        )}
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
  button: {
    width: 140,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  mapSnapshot: {width: 300, height: 300},
});

export default MarkerTypes;
