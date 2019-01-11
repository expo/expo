import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { Permissions, Location, TaskManager } from 'expo';

const LOCATION_TASK_NAME = 'background-location';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.log(error);
  }

  if (data) {
    console.log(`data: ${JSON.stringify(data)}`);
  }
});

export default class App extends React.Component {
  state = {
    locationUpdatesEnabled: undefined,
  };

  async componentDidMount() {
    let locationUpdatesEnabled = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    this.setState({ locationUpdatesEnabled });
  }

  _startLocationUpdates = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      alert('uhh..');
    }

    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
      });
      this.setState({ locationUpdatesEnabled: true });
    } catch (e) {
      console.error(e);
    }
  };

  _stopLocationUpdates = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      this.setState({ locationUpdatesEnabled: false });
    } catch (e) {
      console.error(e);
    }
  };

  render() {
    return (
      <View style={styles.container}>
        {typeof this.state.locationUpdatesEnabled === 'undefined'
          ? null
          : this._renderToggle()}
      </View>
    );
  }

  _renderToggle = () => {
    if (this.state.locationUpdatesEnabled) {
      return (
        <Button
          title="Stop tracking location"
          onPress={this._stopLocationUpdates}
        />
      );
    } else {
      return (
        <Button
          title="Start tracking location"
          onPress={this._startLocationUpdates}
        />
      );
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});