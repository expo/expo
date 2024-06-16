import { type EventSubscription } from 'expo-modules-core';
import * as Sensors from 'expo-sensors';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        <BarometerSensor />
        <LightSensor />
        <DeviceMotionSensor />
      </ScrollView>
    );
  }
}

type State<Measurement> = {
  data: Measurement;
  isListening: boolean;
  isAvailable?: boolean;
};

abstract class SensorBlock<Measurement> extends React.Component<object, State<Measurement>> {
  readonly state: State<Measurement> = {
    data: {} as Measurement,
    isListening: false,
  };

  _subscription?: EventSubscription;

  componentDidMount() {
    this.checkAvailability();
  }

  checkAvailability = async () => {
    const isAvailable = await this.getSensor().isAvailableAsync();
    this.setState({ isAvailable });
  };

  componentWillUnmount() {
    this._unsubscribe();
  }

  abstract getName: () => string;
  abstract getSensor: () => Sensors.DeviceSensor<Measurement>;

  _toggle = () => {
    if (this._subscription) {
      this._unsubscribe();
      this.setState({ isListening: false });
    } else {
      this._subscribe();
      this.setState({ isListening: true });
    }
  };

  _slow = () => {
    this.getSensor().setUpdateInterval(SLOW_INTERVAL);
  };

  _fast = () => {
    this.getSensor().setUpdateInterval(FAST_INTERVAL);
  };

  _subscribe = () => {
    this._subscription = this.getSensor().addListener((data: Measurement) => {
      this.setState({ data });
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = undefined;
  };

  renderData() {
    return (
      this.state.data && (
        <Text>
          {Object.entries(this.state.data)
            .sort(([keyA], [keyB]) => {
              return keyA.localeCompare(keyB);
            })
            .map(([key, value]) => `${key}: ${typeof value === 'number' ? round(value) : 0}`)
            .join('\n')}
        </Text>
      )
    );
  }

  render() {
    if (this.state.isAvailable !== true) {
      return null;
    }
    return (
      <View style={styles.sensor}>
        <Text>{this.getName()}:</Text>
        {this.renderData()}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this._toggle} style={styles.button}>
            <Text>{this.state.isListening ? 'Stop' : 'Start'}</Text>
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

class GyroscopeSensor extends SensorBlock<Sensors.GyroscopeMeasurement> {
  getName = () => 'Gyroscope';
  getSensor = () => Sensors.Gyroscope;
}

class AccelerometerSensor extends SensorBlock<Sensors.AccelerometerMeasurement> {
  getName = () => 'Accelerometer';
  getSensor = () => Sensors.Accelerometer;
}

class MagnetometerSensor extends SensorBlock<Sensors.MagnetometerMeasurement> {
  getName = () => 'Magnetometer';
  getSensor = () => Sensors.Magnetometer;
}

class MagnetometerUncalibratedSensor extends SensorBlock<Sensors.MagnetometerUncalibratedMeasurement> {
  getName = () => 'Magnetometer (Uncalibrated)';
  getSensor = () => Sensors.MagnetometerUncalibrated;
}

class DeviceMotionSensor extends SensorBlock<Sensors.DeviceMotionMeasurement> {
  getName = () => 'DeviceMotion';
  getSensor = () => Sensors.DeviceMotion;
  renderXYZBlock = (name: string, event: null | { x?: number; y?: number; z?: number } = {}) => {
    if (!event) return null;
    const { x, y, z } = event;
    return (
      <Text>
        {name}: x: {round(x)} y: {round(y)} z: {round(z)}
      </Text>
    );
  };
  renderABGBlock = (
    name: string,
    event: null | { alpha?: number; beta?: number; gamma?: number } = {}
  ) => {
    if (!event) return null;

    const { alpha, beta, gamma } = event;
    return (
      <Text>
        {name}: α: {round(alpha)} β: {round(beta)} γ: {round(gamma)}
      </Text>
    );
  };
  renderData = () => (
    <View>
      {this.renderXYZBlock('Acceleration', this.state.data.acceleration)}
      {this.renderXYZBlock('Acceleration w/gravity', this.state.data.accelerationIncludingGravity)}
      {this.renderABGBlock('Rotation', this.state.data.rotation)}
      {this.renderABGBlock('Rotation rate', this.state.data.rotationRate)}
      <Text>Orientation: {Sensors.DeviceMotionOrientation[this.state.data.orientation]}</Text>
    </View>
  );
}

class BarometerSensor extends SensorBlock<Sensors.BarometerMeasurement> {
  getName = () => 'Barometer';
  getSensor = () => Sensors.Barometer;
  renderData = () => (
    <View>
      <Text>Pressure: {this.state.data.pressure}</Text>
      <Text>Relative Altitude: {this.state.data.relativeAltitude}</Text>
    </View>
  );
}

class LightSensor extends SensorBlock<Sensors.LightSensorMeasurement> {
  getName = () => 'LightSensor';
  getSensor = () => Sensors.LightSensor;
  renderData = () => (
    <View>
      <Text>Illuminance: {this.state.data.illuminance}</Text>
    </View>
  );
}

function round(n?: number) {
  return n ? Math.floor(n * 100) / 100 : 0;
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
