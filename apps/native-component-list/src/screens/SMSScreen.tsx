import * as SMS from 'expo-sms';
import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

interface State {
  phoneNumbers: string[];
  message?: string;
  error?: string;
  result?: string;
}

export default class SMSScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'SMS',
  };

  readonly state: State = {
    phoneNumbers: [],
  };

  _sendSMS = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      this.setState({
        error: 'SMS functionality is not available on this device!',
      });
      setTimeout(() => this.setState({ error: undefined }), 10000);
      return;
    }
    try {
      if (this.state.message) {
        const { result } = await SMS.sendSMSAsync(this.state.phoneNumbers, this.state.message);
        this.setState({ phoneNumbers: [], message: undefined, result });
        setTimeout(() => this.setState({ result: undefined }), 5000);
      }
    } catch (e) {
      this.setState({ error: e.message });
      setTimeout(() => this.setState({ error: undefined }), 10000);
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.phoneNumbers}
          placeholder="Phone numbers, comma separated"
          value={this.state.phoneNumbers.join(',')}
          onChangeText={phoneNumbers =>
            this.setState({
              phoneNumbers: phoneNumbers.split(',').map(e => e.trim()),
            })
          }
        />
        <TextInput
          style={styles.message}
          placeholder="Message"
          value={this.state.message}
          onChangeText={message => this.setState({ message })}
        />
        <Button title="Send" disabled={!this.state.message} onPress={this._sendSMS}>
          Send SMS
        </Button>
        {this.state.error && (
          <View style={[styles.textView, styles.errorView]}>
            <Text style={styles.errorText}>{this.state.error}</Text>
          </View>
        )}
        {this.state.result && (
          <View style={[styles.textView, styles.resultView]}>
            <Text>{this.state.result}</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
    padding: 10,
  },
  phoneNumbers: {
    height: 40,
  },
  message: {
    height: 40,
  },
  errorView: {
    backgroundColor: 'red',
  },
  resultView: {
    borderColor: 'blue',
    borderWidth: 2,
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
});
