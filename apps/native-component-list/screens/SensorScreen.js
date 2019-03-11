import {
  Accelerometer,
  Barometer,
  DeviceMotion,
  Gyroscope,
  Magnetometer,
  MagnetometerUncalibrated,
} from 'expo-sensors';
import React from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
        <DeviceMotionSensor />
      </ScrollView>
    );
  }
}
// <SensorVisualizer
// onStop={() => Accelerometer.removeAllListeners()}
// onStart={callback => {
//   Accelerometer.addListener(callback);
// }}
// />

class SensorBlock extends React.Component {
  state = {
    data: {},
    isAvailable: undefined,
  };

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
    if (this.state.isAvailable !== true) {
      return null;
    }
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

class BarometerSensor extends SensorBlock {
  getName = () => 'Barometer';
  getSensor = () => Barometer;
  renderData = () => (
    <View>
      <Text>Pressure: {this.state.data.pressure}</Text>
      <Text>Relative Altitude: {this.state.data.relativeAltitude}</Text>
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

const COUNT = 5;
const ITEM_SIZE = Dimensions.get('window').width / COUNT;

class SensorVisualizer extends React.Component {
  static defaultProps = {
    perspective: 200,
    numItems: COUNT,
  };

  state = {
    items: [],
  };

  componentWillUnmount() {
    this.props.onStop();
  }

  componentWillMount() {
    const items = [];
    for (let i = 0; i < this.props.numItems; i++) {
      items.push({ position: new Animated.ValueXY() });
    }
    this.setState({ items });
  }

  componentDidMount() {
    this.props.onStart(({ x, y }) => {
      this.state.items.forEach((box, index) => {
        // All that matters is that the values are the same on iOS, Android, Web, ect...

        const { perspective } = this.props;
        const nIndex = index + 1;

        Animated.spring(this.state.items[index].position, {
          toValue: {
            x: (x.toFixed(1) * perspective * nIndex) / COUNT,
            y: (-y.toFixed(1) * perspective * nIndex) / COUNT,
          },
          friction: 7,
        }).start();
      });
    });
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ position: 'absolute', top: 24, left: 24, right: 24, textAlign: 'center' }}>
          The stack should move against the direction of the device. If you lift the bottom of the
          phone up, the stack should translate down towards the bottom of the screen
        </Text>
        {this.state.items.map((val, index) => {
          return (
            <Animated.View
              key={`item-${index}`}
              style={{
                position: 'absolute',
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                borderRadius: ITEM_SIZE,
                backgroundColor: 'red',
                opacity: (index + 1) / COUNT,
                transform: [
                  { translateX: this.state.items[index].position.x },
                  { translateY: this.state.items[index].position.y },
                ],
              }}
            />
          );
        })}
      </View>
    );
  }
}
