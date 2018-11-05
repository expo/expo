// @flow

import React from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Pedometer } from 'expo';
import ListButton from '../components/ListButton';

export default class PedometerScreen extends React.Component {
  static navigationOptions = {
    title: 'Pedometer',
  };

  state = { stepCount: null };
  _listener: { remove: () => void } = null;

  render() {
    return (
      <ScrollView style={{ padding: 10 }}>
        <ListButton
          onPress={async () => {
            const result = await Pedometer.isAvailableAsync();
            Alert.alert('Pedometer result', `Is available: ${result}`);
          }}
          title="Is available"
        />
        <ListButton
          onPress={async () => {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 1);
            const result = await Pedometer.getStepCountAsync(start, end);
            Alert.alert('Pedometer result', `Number of steps for the last day: ${result.steps}`);
          }}
          title="Get steps count"
        />
        <ListButton
          onPress={async () => {
            this._listener = Pedometer.watchStepCount(data => {
              this.setState({ stepCount: data.steps });
            });
          }}
          title="Listen for step count updates"
        />
        <ListButton
          onPress={async () => {
            if (this._listener) {
              this._listener.remove();
              this._listener = null;
            }
          }}
          title="Stop listening for step count updates"
        />
        {this.state.stepCount !== null ? <Text>Total steps {this.state.stepCount}</Text> : null}
      </ScrollView>
    );
  }
}
