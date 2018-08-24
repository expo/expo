import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import { Accelerometer, Gyroscope, Magnetometer, MagnetometerUncalibrated, DangerZone } from 'expo';
const { DeviceMotion } = DangerZone;

const FAST_INTERVAL = 16;
const SLOW_INTERVAL = 1000;

export default class SensorScreen extends React.Component {
  static navigationOptions = {
    title: 'Sensors',
  };

  render() {
    return (
      <ScrollView style={styles.container}>
        <GyroscopeSensor />
        <AccelerometerSensor />
        <MagnetometerSensor />
        <MagnetometerUncalibratedSensor />
        <DeviceMotionSensor />
      </ScrollView>
    );
  }
}

class SensorBlock extends React.Component {
  state = {
    data: {},
  };

  componentWillUnmount() {
    this._unsubscribe();
  }

  getName = () => {};
  getSensor = () => {};

  _toggle = () => {
    if (this._subscription) {
      this._unsubscribe();
    } else {
      this._subscribe();
    }
  };

  _slow = () => {
    this.getSensor().setUpdateInterval(SLOW_INTERVAL);
  };

  _fast = () => {
    this.getSensor().setUpdateInterval(FAST_INTERVAL);
  };

  _subscribe = () => {
    this._subscription = this.getSensor().addListener(result => {
      this.setState({ data: result });
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  renderData = () => (
    <Text>
      x: {round(this.state.data.x)} y: {round(this.state.data.y)} z: {round(this.state.data.z)}
    </Text>
  );

  render() {
    return (
      <View style={styles.sensor}>
        <Text>{this.getName()}:</Text>
        {this.renderData()}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this._toggle} style={styles.button}>
            <Text>Toggle</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._slow} style={[styles.button, styles.middleButton]}>
            <Text>Slow</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._fast} style={styles.button}>
            <Text>Fast</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

class GyroscopeSensor extends SensorBlock {
  getName = () => 'Gyroscope';
  getSensor = () => Gyroscope;
}

class AccelerometerSensor extends SensorBlock {
  getName = () => 'Accelerometer';
  getSensor = () => Accelerometer;
}

class MagnetometerSensor extends SensorBlock {
  getName = () => 'Magnetometer';
  getSensor = () => Magnetometer;
}

class MagnetometerUncalibratedSensor extends SensorBlock {
  getName = () => 'Magnetometer (Uncalibrated)';
  getSensor = () => MagnetometerUncalibrated;
}

class DeviceMotionSensor extends SensorBlock {
  getName = () => 'DangerZone.DeviceMotion';
  getSensor = () => DeviceMotion;
  _renderXYZBlock = (name, { x, y, z } = {}) => (
    <Text>
      {name}: x: {round(x)} y: {round(y)} z: {round(z)}
    </Text>
  );
  _renderABGBlock = (name, { alpha, beta, gamma } = {}) => (
    <Text>
      {name}: α: {round(alpha)} β: {round(beta)} γ: {round(gamma)}
    </Text>
  );
  renderData = () => (
    <View>
      {this._renderXYZBlock('Acceleration', this.state.data.acceleration)}
      {this._renderXYZBlock('Acceleration w/gravity', this.state.data.accelerationIncludingGravity)}
      {this._renderABGBlock('Rotation', this.state.data.rotation)}
      {this._renderABGBlock('Rotation rate', this.state.data.rotationRate)}
      <Text>Orientation: {this.state.data.orientation}</Text>
    </View>
  );
}

function round(n) {
  if (!n) {
    return 0;
  }

  return Math.floor(n * 100) / 100;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 15,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 10,
  },
  middleButton: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  sensor: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
});
