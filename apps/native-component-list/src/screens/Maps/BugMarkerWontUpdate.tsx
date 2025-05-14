import React from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';

import MyLocationMapMarker from './MyLocationMapMarker';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

class BugMarkerWontUpdate extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      coordinate: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
      },
      amount: 0,
      enableHack: false,
    };
  }

  increment() {
    this.setState({ amount: this.state.amount + 10 });
  }

  decrement() {
    this.setState({ amount: this.state.amount - 10 });
  }

  toggleHack() {
    this.setState({ enableHack: !this.state.enableHack });
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          initialRegion={this.state.region}>
          <MyLocationMapMarker
          // coordinate={this.state.coordinate}
          // heading={this.state.amount}
          // enableHack={this.state.enableHack}
          />
        </MapView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => this.toggleHack()}
            style={[styles.bubble, styles.button, styles.hackButton]}>
            <Text style={styles.toggleHack}>
              {this.state.enableHack ? 'Disable Hack' : 'Enable Hack'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => this.decrement()} style={[styles.bubble, styles.button]}>
            <Text style={styles.ammountButton}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.increment()} style={[styles.bubble, styles.button]}>
            <Text style={styles.ammountButton}>+</Text>
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
  hackButton: {
    width: 200,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
  toggleHack: { fontSize: 12, fontWeight: 'bold' },
  ammountButton: { fontSize: 20, fontWeight: 'bold' },
});

export default BugMarkerWontUpdate;
