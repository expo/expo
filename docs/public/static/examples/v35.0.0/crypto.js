import React from 'react';
import { View, Text } from 'react-native';
import * as Crypto from 'expo-crypto';

export default class DemoView extends React.Component {
  async componentDidMount() {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'Github stars are neat 🌟'
    );
    console.log('Digest: ', digest);

    /* Some crypto operation... */
  }
  render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>Crypto Module Example</Text>
      </View>
    );
  }
}
