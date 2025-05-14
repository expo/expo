import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

import MapView, {Marker} from 'react-native-maps';
import flagPinkImg from './assets/flag-pink.png';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
let id = 0;

class MassiveCustomMarkers extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      markers: [],
    };

    this.onMapPress = this.onMapPress.bind(this);
  }

  generateMarkers(fromCoordinate: any) {
    const result = [];
    const {latitude, longitude} = fromCoordinate;
    for (let i = 0; i < 100; i++) {
      const newMarker = {
        coordinate: {
          latitude: latitude + 0.001 * i,
          longitude: longitude + 0.001 * i,
        },
        key: `foo${id++}`,
      };
      result.push(newMarker);
    }
    return result;
  }

  onMapPress(e: any) {
    this.setState({
      markers: [
        ...this.state.markers,
        ...this.generateMarkers(e.nativeEvent.coordinate),
      ],
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          initialRegion={this.state.region}
          onPress={this.onMapPress}>
          {this.state.markers.map((marker: any) => (
            <Marker
              title={marker.key}
              image={flagPinkImg}
              key={marker.key}
              coordinate={marker.coordinate}
            />
          ))}
        </MapView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => this.setState({markers: []})}
            style={styles.bubble}>
            <Text>Tap map to create 100 markers</Text>
          </TouchableOpacity>
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

export default MassiveCustomMarkers;
