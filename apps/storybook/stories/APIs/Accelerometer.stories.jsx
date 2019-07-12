import { Accelerometer } from 'expo-sensors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppText, DocItem, Section } from '../ui-explorer';

export const title = 'Accelerometer';
export const label = 'Accelerometer';
export const kind = 'SDK|Sensors';
export const packageJson = require('expo-sensors/package.json');
export const description = `Access the device accelerometer sensor(s) to respond to changes in acceleration in 3d
space.`;

export class component extends React.Component {
  state = {
    accelerometerData: {},
    isAvailable: null,
  };

  componentDidMount() {
    this._toggle();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _toggle = () => {
    if (this._subscription) {
      this._unsubscribe();
    } else {
      this._subscribe();
    }
  };

  _slow = () => {
    Accelerometer.setUpdateInterval(1000);
  };

  _fast = () => {
    Accelerometer.setUpdateInterval(16);
  };

  _subscribe = () => {
    this._subscription = Accelerometer.addListener(accelerometerData => {
        this.setState({ accelerometerData });
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  render() {
    const { x, y, z } = this.state.accelerometerData;
    const { isAvailable } = this.state;
    return (
      <Section title="Methods">
        <DocItem
          name="isAvailableAsync"
          typeInfo="Promise<boolean>"
          description="Returns whether the accelerometer is enabled on the device."
          example={{
            render: () => (
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={this._toggle} style={styles.button}>
                  <Text
                    onPress={async () => {
                      this.setState({
                        isAvailable: await Accelerometer.isAvailableAsync(),
                      });
                    }}>
                    Is Available: {isAvailable ? 'true' : 'false'}
                  </Text>
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <DocItem
          name="addListener"
          typeInfo="({ x: number, y: number, z: number}) => void"
          description="Subscribe to events and update the component state with the new data from the Accelerometer. We save the subscription object away so that we can remove it when the component is unmounted."
          example={{
            render: () => (
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={this._toggle} style={styles.button}>
                  <Text>Toggle</Text>
                </TouchableOpacity>
                <AppText>Values:</AppText>
                {Object.keys({ x, y, z }).map(key => {
                  return (
                    <Text key={key}>
                      {key}: {round(this.state.accelerometerData[key])}
                    </Text>
                  );
                })}
              </View>
            ),
          }}
        />

        <DocItem
          name="setUpdateInterval"
          typeInfo="(interval: number) => Promise<void>"
          description="Subscribe for updates to the accelerometer."
          example={{
            render: () => (
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={this._slow}
                    style={[styles.button, styles.middleButton]}>
                    <Text>Slow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={this._fast} style={styles.button}>
                    <Text>Fast</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ),
          }}
        />
      </Section>
    );
  }
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
