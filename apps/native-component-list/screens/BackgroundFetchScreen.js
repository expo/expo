import React from 'react';
import { BackgroundFetch, TaskManager } from 'expo';
import { AsyncStorage, Platform, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';

const BACKGROUND_FETCH_TASK = 'background-fetch';
const LAST_FETCH_DATE_KEY = 'background-fetch-date';

export default class BackgroundFetchScreen extends React.Component {
  static navigationOptions = {
    title: 'Background Fetch',
  };

  state = {
    fetchDate: null,
    status: null,
    isRegistered: false,
  };

  componentDidMount() {
    this.getLastFetchDateAsync();
    this.checkStatusAsync();
  }

  async getLastFetchDateAsync() {
    const lastFetchDateStr = await AsyncStorage.getItem(LAST_FETCH_DATE_KEY);

    if (lastFetchDateStr) {
      this.setState({ fetchDate: new Date(+lastFetchDateStr) });
    }
  }

  async checkStatusAsync() {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    this.setState({ status, isRegistered });
  }

  toggle = async () => {
    if (this.state.isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    } else {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK);
      await BackgroundFetch.setMinimumIntervalAsync(60 * 10); // 10 minutes
    }
    this.setState({ isRegistered: !this.state.isRegistered });
  };

  renderText() {
    if (!this.state.fetchDate) {
      return <Text>There was no BackgroundFetch call yet.</Text>;
    }
    return (
      <Text>
        Last background fetch was invoked at:
        <Text style={styles.boldText}>{this.state.fetchDate.toISOString()}</Text>
      </Text>
    );
  }

  render() {
    if (Platform.OS !== 'ios') {
      return (
        <View style={styles.screen}>
          <View style={styles.textContainer}>
            <Text>
              BackgroundFetch API is not supported on platform:{' '}
              <Text style={styles.boldText}>{Platform.OS}</Text>
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.screen}>
        <View style={styles.textContainer}>
          <Text>
            Background fetch status:{' '}
            <Text style={styles.boldText}>
              {this.state.status ? BackgroundFetch.Status[this.state.status] : null}
            </Text>
          </Text>
        </View>
        <View style={styles.textContainer}>{this.renderText()}</View>
        <Button
          buttonStyle={styles.button}
          title={
            this.state.isRegistered
              ? 'Unregister BackgroundFetch task'
              : 'Register BackgroundFetch task'
          }
          onPress={this.toggle}
        />
      </View>
    );
  }
}

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = Date.now();

  console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);
  await AsyncStorage.setItem(LAST_FETCH_DATE_KEY, now.toString());

  return BackgroundFetch.Result.NewData;
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 10,
    marginVertical: 5,
  },
  textContainer: {
    margin: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
});
