import format from 'date-format';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { AppState, AppStateStatus, AsyncStorage, StyleSheet, Text, View } from 'react-native';
import { NavigationEvents } from 'react-navigation';

import Button from '../components/Button';

const BACKGROUND_FETCH_TASK = 'background-fetch';
const LAST_FETCH_DATE_KEY = 'background-fetch-date';

interface State {
  fetchDate?: Date;
  status?: BackgroundFetch.Status | null;
  isRegistered: boolean;
}

export default class BackgroundFetchScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'Background Fetch',
  };

  readonly state: State = {
    isRegistered: false,
  };

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  didFocus = () => {
    this.refreshLastFetchDateAsync();
    this.checkStatusAsync();
  };

  handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      this.refreshLastFetchDateAsync();
    }
  };

  async refreshLastFetchDateAsync() {
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
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60, // 1 minute
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
    this.setState({ isRegistered: !this.state.isRegistered });
  };

  renderText() {
    if (!this.state.fetchDate) {
      return <Text>There was no BackgroundFetch call yet.</Text>;
    }
    return (
      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Text>Last background fetch was invoked at:</Text>
        <Text style={styles.boldText}>
          {format('yyyy-MM-dd hh:mm:ss:SSS', this.state.fetchDate)}
        </Text>
      </View>
    );
  }

  render() {
    return (
      <View style={styles.screen}>
        <NavigationEvents onDidFocus={this.didFocus} />
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
