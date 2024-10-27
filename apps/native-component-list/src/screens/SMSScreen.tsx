import * as SMS from 'expo-sms';
import { useReducer, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

type State = {
  message?: string;
  phoneNumbers: string[];
  result?: string;
};

export default function SMSScreen() {
  const [error, setError] = useState<string>();
  const [state, setState] = useReducer((s: State, a: Partial<State>) => ({ ...s, ...a }), {
    message: undefined,
    phoneNumbers: [],
    result: undefined,
  });

  const _sendSMS = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      setError('SMS functionality is not available on this device!');
      setTimeout(() => setError(undefined), 10000);
      return;
    }
    try {
      if (state.message) {
        const { result } = await SMS.sendSMSAsync(state.phoneNumbers, state.message);
        setState({ phoneNumbers: [], message: undefined, result });

        setTimeout(() => setState({ result: undefined }), 5000);
      }
    } catch (e) {
      setError(e.message);

      setTimeout(() => setError(undefined), 10000);
    }
  };

  const _sendSMSWithInvalidRecipient = async (address: null | undefined) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      setError('SMS functionality is not available on this device!');
      setTimeout(() => setError(undefined), 10000);
      return;
    }
    try {
      if (state.message) {
        // @ts-ignore -- testing if addresses === null is handled
        // expected behavior: exception is thrown
        const { result } = await SMS.sendSMSAsync(address, state.message);
        setState({
          phoneNumbers: [],
          message: undefined,
          result,
        });

        setTimeout(() => setState({ result: undefined }), 5000);
      }
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(undefined), 10000);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.phoneNumbers}
        placeholder="Phone numbers, comma separated"
        value={state.phoneNumbers.join(',')}
        onChangeText={(phoneNumbers) =>
          setState({ phoneNumbers: phoneNumbers.split(',').map((e) => e.trim()) })
        }
      />
      <TextInput
        style={styles.message}
        placeholder="Message"
        value={state.message}
        onChangeText={(message) => setState({ message })}
      />
      <Button title="Send" disabled={!state.message} onPress={_sendSMS} />
      <Button
        title="Send message with null recipient"
        disabled={!state.message}
        onPress={() => _sendSMSWithInvalidRecipient(undefined)}
      />
      <Button
        title="Send message with undefined recipient"
        disabled={!state.message}
        onPress={() => _sendSMSWithInvalidRecipient(null)}
      />
      {error && (
        <View style={[styles.textView, styles.errorView]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {state.result && (
        <View style={[styles.textView, styles.resultView]}>
          <Text>{state.result}</Text>
        </View>
      )}
    </View>
  );
}

SMSScreen.navigationOptions = {
  title: 'SMS',
};

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
