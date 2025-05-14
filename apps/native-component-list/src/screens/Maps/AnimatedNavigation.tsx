import React, {Component} from 'react';

import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';

import MapView, {Marker} from 'react-native-maps';
// @ts-ignore
import carImage from './assets/car.png';

export default class NavigationMap extends Component<any, any> {
  map: any;
  constructor(props: any) {
    super(props);
    this.state = {
      prevPos: null,
      curPos: {latitude: 37.420814, longitude: -122.081949},
      curAng: 45,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    this.changePosition = this.changePosition.bind(this);
    this.getRotation = this.getRotation.bind(this);
    this.updateMap = this.updateMap.bind(this);
  }

  changePosition(latOffset: number, lonOffset: number) {
    const latitude = this.state.curPos.latitude + latOffset;
    const longitude = this.state.curPos.longitude + lonOffset;
    this.setState({
      prevPos: this.state.curPos,
      curPos: {latitude, longitude},
    });
    this.updateMap();
  }

  getRotation(prevPos: any, curPos: any) {
    if (!prevPos) {
      return 0;
    }
    const xDiff = curPos.latitude - prevPos.latitude;
    const yDiff = curPos.longitude - prevPos.longitude;
    return (Math.atan2(yDiff, xDiff) * 180.0) / Math.PI;
  }

  updateMap() {
    const {curPos, prevPos, curAng} = this.state;
    const curRot = this.getRotation(prevPos, curPos);
    this.map.animateCamera({heading: curRot, center: curPos, pitch: curAng});
  }

  render() {
    return (
      <View style={styles.flex}>
        <MapView
          ref={el => (this.map = el)}
          style={styles.flex}
          minZoomLevel={15}
          initialRegion={{
            ...this.state.curPos,
            latitudeDelta: this.state.latitudeDelta,
            longitudeDelta: this.state.longitudeDelta,
          }}>
          <Marker
            coordinate={this.state.curPos}
            anchor={{x: 0.5, y: 0.5}}
            image={carImage}
          />
        </MapView>
        <View style={styles.buttonContainerUpDown}>
          <TouchableOpacity
            style={[styles.button, styles.up]}
            onPress={() => this.changePosition(0.0001, 0)}>
            <Text>+ Lat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.down]}
            onPress={() => this.changePosition(-0.0001, 0)}>
            <Text>- Lat</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainerLeftRight}>
          <TouchableOpacity
            style={[styles.button, styles.left]}
            onPress={() => this.changePosition(0, -0.0001)}>
            <Text>- Lon</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.right]}
            onPress={() => this.changePosition(0, 0.0001)}>
            <Text>+ Lon</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    width: '100%',
  },
  buttonContainerUpDown: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonContainerLeftRight: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: 'rgba(100,100,100,0.2)',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    height: 50,
    width: 50,
  },
  up: {
    alignSelf: 'flex-start',
  },
  down: {
    alignSelf: 'flex-end',
  },
  left: {
    alignSelf: 'flex-start',
  },
  right: {
    alignSelf: 'flex-end',
  },
});
