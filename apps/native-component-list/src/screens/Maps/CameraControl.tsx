import React from 'react';
import {StyleSheet, View, TouchableOpacity, Text, Alert} from 'react-native';

import MapView from 'react-native-maps';

const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;

class CameraControl extends React.Component<any, any> {
  map: any;
  async getCamera() {
    const camera = await this.map.getCamera();
    Alert.alert('Current camera', JSON.stringify(camera), [{text: 'OK'}], {
      cancelable: true,
    });
  }

  async setCamera() {
    const camera = await this.map.getCamera();
    // Note that we do not have to pass a full camera object to setCamera().
    // Similar to setState(), we can pass only the properties you like to change.
    this.map.setCamera({
      heading: camera.heading + 10,
    });
  }

  async animateCamera() {
    const camera = await this.map.getCamera();
    camera.heading += 40;
    camera.pitch += 10;
    camera.altitude += 1000;
    camera.zoom -= 1;
    camera.center.latitude += 0.5;
    this.map.animateCamera(camera, {duration: 2000});
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
          initialCamera={{
            center: {
              latitude: LATITUDE,
              longitude: LONGITUDE,
            },
            pitch: 45,
            heading: 90,
            altitude: 1000,
            zoom: 10,
          }}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => this.getCamera()}
            style={[styles.bubble, styles.button]}>
            <Text>Get current camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.setCamera()}
            style={[styles.bubble, styles.button]}>
            <Text>Set Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.animateCamera()}
            style={[styles.bubble, styles.button]}>
            <Text>Animate Camera</Text>
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
  button: {
    marginTop: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});

export default CameraControl;
