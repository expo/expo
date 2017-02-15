Accelerometer
=============

Access the device accelerometer sensor(s) to respond to changes in acceleration
in 3d space.

.. function:: Exponent.Accelerometer.addListener(listener)

   Subscribe for updates to the accelerometer.

   :param function listener:
      A callback that is invoked when an accelerometer update is available.
      When invoked, the listener is provided a single argumument that is an
      object containing keys x, y, z.

   :returns:
      An EventSubscription object that you can call `remove()` on when you
      would like to unsubscribe the listener.


.. function:: Exponent.Accelerometer.removeAllListeners()

    Remove all listeners.

.. function:: Exponent.Accelerometer.setUpdateInterval(intervalMs)

   Subscribe for updates to the accelerometer.

   :param number intervalMs:
     Desired interval in milliseconds between accelerometer updates.

Example: basic subscription
'''''''''''''''''''''''''''

.. code-block:: javascript

  import React from 'react';
  import Exponent, {
    Accelerometer,
  } from 'exponent';
  import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
  } from 'react-native';

  class AccelerometerSensor extends React.Component {
    state = {
      accelerometerData: {},
    }

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
    }

    _slow = () => {
      Accelerometer.setUpdateInterval(1000);
    }

    _fast = () => {
      Accelerometer.setUpdateInterval(16);
    }

    _subscribe = () => {
      this._subscription = Accelerometer.addListener((result) => {
        this.setState({accelerometerData: result});
      });
    }

    _unsubscribe = () => {
      this._subscription && this._subscription.remove();
      this._subscription = null;
    }

    render() {
      let { x, y, z } = this.state.accelerometerData;

      return (
        <View style={styles.sensor}>
          <Text>Accelerometer:</Text>
          <Text>x: {round(x)} y: {round(y)} z: {round(z)}</Text>

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

  function round(n) {
    if (!n) {
      return 0;
    }

    return Math.floor(n * 100) / 100;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1
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

  Exponent.registerRootComponent(AccelerometerSensor);
