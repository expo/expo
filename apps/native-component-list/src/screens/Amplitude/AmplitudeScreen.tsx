import * as Amplitude from 'expo-analytics-amplitude';
import React from 'react';
import { View, StyleSheet, TextInput, Button, Text, ScrollView } from 'react-native';

import TrackingOptionsSelector from './TrackingOptionsSelector';

interface State {
  clientAPIKey?: string;
  error?: boolean;
  errorMessage?: string;
  result?: string;
  initialized: boolean;
}

export default class AmplitudeApiScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'Amplitude',
  };

  readonly state: State = {
    clientAPIKey: '',
    error: undefined,
    errorMessage: undefined,
    result: undefined,
    initialized: false,
  };

  private testUserId: string = 'testUserId';
  private testEventName: string = 'test event';
  private testGroupType: string = 'testGroupType';
  private timer?: NodeJS.Timeout;

  _cleanup = (...keys: string[]) => {
    this.setState(keys.reduce((o, key) => ({ ...o, [key]: undefined }), {}));
  };

  _deferredCleanup = async (time: number, ...keys: string[]) => {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this._cleanup(...keys);
      this.timer = undefined;
    }, time);
  };

  _deferredResultCleanup = () => this._deferredCleanup(5000, 'result');

  _deferredErrorCleanup = () => this._deferredCleanup(5000, 'error', 'errorMessage');

  _initializeAsync = async () => {
    if (this.state.clientAPIKey) {
      await Amplitude.initializeAsync(this.state.clientAPIKey).then(
        () => {
          this.setState({ result: 'Module initialized', initialized: true });
          this._deferredResultCleanup();
        },
        () => {
          this.setState({ error: true, errorMessage: 'Failed to initialize module' });
          this._deferredErrorCleanup();
        }
      );
    } else {
      this.setState({ error: true, errorMessage: 'Invalid api key' });
      this._deferredErrorCleanup();
    }
  };

  _setUserIdAsync = async () => {
    await Amplitude.setUserIdAsync(this.testUserId).then(
      () => {
        this.setState({ result: `User ID set to ${this.testUserId}` });
        this._deferredResultCleanup();
      },
      () => {
        this.setState({
          error: true,
          errorMessage: 'Failed to set UserId. Make sure that provided API key is valid.',
        });
        this._deferredErrorCleanup();
      }
    );
  };

  _logEventAsync = async () => {
    await Amplitude.logEventAsync(this.testEventName).then(
      () => {
        this.setState({ result: `"${this.testEventName}" logged` });
        this._deferredResultCleanup();
      },
      () => {
        this.setState({
          error: true,
          errorMessage: 'Failed to log event. Make sure that provided API key is valid.',
        });
        this._deferredErrorCleanup();
      }
    );
  };

  _logEventWithPropertiesAsync = async () => {
    await Amplitude.logEventWithPropertiesAsync(this.testEventName, {
      'test property 1': 'value for property 1',
      'test property 2': 'value for property 2',
    }).then(
      () => {
        this.setState({ result: `${this.testEventName} with mock properties logged` });
        this._deferredResultCleanup();
      },
      () => {
        this.setState({
          error: true,
          errorMessage: 'Failed to log event. Make sure that provided API key is valid.',
        });
        this._deferredErrorCleanup();
      }
    );
  };

  _setGroupAsync = async () => {
    await Amplitude.setGroupAsync(this.testGroupType, ['groupName1', 'groupName2']).then(
      () => {
        this.setState({ result: 'Groups added' });
        this._deferredResultCleanup();
      },
      () => {
        this.setState({
          error: true,
          errorMessage: 'Failed to add groups. Make sure that provided API key is valid.',
        });
        this._deferredErrorCleanup();
      }
    );
  };

  render() {
    return (
      <ScrollView style={styles.container}>
        <Text>To conduct test:</Text>
        <Text>1. Login on https://analytics.amplitude.com/ on your organization account</Text>
        <Text>2. If there is no test project - create one</Text>
        <Text>3. Go to Settings/Projects</Text>
        <Text>4. Choose the test project</Text>
        <Text>5. Enter displayed API key into input field below</Text>
        <Text>6. Initialize amplitude module</Text>
        <Text>
          7. From your Amplitude project site, track if events are logged on "LOG *" buttons press
        </Text>
        <TextInput
          style={styles.textInputForApiKey}
          placeholder="Provide Amplitude API key"
          value={this.state.clientAPIKey}
          onChangeText={apiKey => {
            this.setState({ clientAPIKey: apiKey });
          }}
        />
        <Button
          title="Initialize Amplitude Module"
          disabled={this.state.clientAPIKey === ''}
          onPress={this._initializeAsync}
        />
        <View style={styles.button}>
          <Button title="Log test event" onPress={this._logEventAsync} />
        </View>
        <View style={styles.button}>
          <Button
            title="Log test event with properties"
            onPress={this._logEventWithPropertiesAsync}
          />
        </View>
        <View style={styles.button}>
          <Button title="Set user id" onPress={this._setUserIdAsync} />
        </View>
        <View style={styles.button}>
          <Button title="Set groups for user" onPress={this._setGroupAsync} />
        </View>
        <TrackingOptionsSelector />
        {this.state.error && (
          <View style={[styles.textView, styles.errorView]}>
            <Text style={styles.errorText}>{this.state.errorMessage}</Text>
          </View>
        )}
        {this.state.result && (
          <View style={[styles.textView, styles.resultView]}>
            <Text>{this.state.result}</Text>
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
    padding: 10,
  },
  textInputForApiKey: {
    height: 40,
  },
  textView: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    color: 'white',
  },
  errorView: {
    backgroundColor: 'red',
  },
  resultView: {
    borderColor: 'green',
    borderWidth: 1,
  },
  button: {
    marginTop: 20,
  },
});
