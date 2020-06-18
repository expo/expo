import { Pedometer } from 'expo-sensors';
import React from 'react';
import { Alert, ScrollView, Text } from 'react-native';

import ListButton from '../components/ListButton';

interface State {
  stepCount?: number;
}

export default class PedometerScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'Pedometer',
  };

  readonly state: State = {};

  listener?: Pedometer.PedometerListener;

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
            this.listener = Pedometer.watchStepCount(data => {
              this.setState({ stepCount: data.steps });
            });
          }}
          title="Listen for step count updates"
        />
        <ListButton
          onPress={async () => {
            if (this.listener) {
              this.listener.remove();
              this.listener = undefined;
            }
          }}
          title="Stop listening for step count updates"
        />
        {this.state.stepCount !== undefined && <Text>Total steps {this.state.stepCount}</Text>}
      </ScrollView>
    );
  }
}
