import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Barometer } from 'expo-sensors';

export default class BarometerSensor extends React.Component {
  state = {
    data: {},
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

  _subscribe = () => {
    this._subscription = Barometer.addListener(data => {
      this.setState({ data });
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  render() {
    const { pressure = 0 } = this.state.data;

    return (
      <View style={styles.sensor}>
        <Text>Barometer:</Text>
        <Text>{pressure * 100} Pa</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this._toggle} style={styles.button}>
            <Text>Toggle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
  sensor: {
    marginTop: 45,
    paddingHorizontal: 10,
  },
});
