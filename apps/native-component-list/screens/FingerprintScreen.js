import React from 'react';
import { ScrollView, View } from 'react-native';
import { Fingerprint } from 'expo';
import Button from '../components/Button';

export default class FingerprintScreen extends React.Component {
  static navigationOptions = {
    title: 'Fingerprint',
  };

  state = {
    waiting: false,
  };

  render() {
    let authFunction = async () => {
      this.setState({ waiting: true });
      try {
        let result = await Fingerprint.authenticateAsync('This message only shows up on iOS');
        if (result.success) {
          alert('Authenticated!');
        } else {
          alert('Failed to authenticate');
        }
      } finally {
        this.setState({ waiting: false });
      }
    };

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button
          onPress={authFunction}
          title={
            this.state.waiting ? 'Waiting for fingerprint... ' : 'Authenticate with fingerprint'
          }
        />
      </View>
    );
  }
}
