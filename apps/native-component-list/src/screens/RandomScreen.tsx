import { getRandomBytes, getRandomBytesAsync } from 'expo-random';
import React from 'react';
import { ScrollView } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

// Placeholder polyfill
// @ts-ignore
if (!global.crypto) {
  // @ts-ignore
  global.crypto = {
    // @ts-ignore
    getRandomValues: (array) => getRandomBytes(array.byteLength),
  };
}

type State = {
  random: any;
  randomAsync: any;
  uuid: any;
};

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class RandomScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Random',
  };

  readonly state: State = {
    random: getRandomBytes(10),
    randomAsync: null,
    uuid: require('uuid').v4(),
  };

  async componentDidMount() {
    this._getRandomAsync();
  }

  _getRandomAsync = async () => {
    const randomAsync = await getRandomBytesAsync(10);
    this.setState({ randomAsync });
  };

  render() {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.greyBackground }}
        contentContainerStyle={{ padding: 10 }}>
        <HeadingText>getRandomBytes:</HeadingText>
        <MonoText>{JSON.stringify(this.state.random)}</MonoText>

        <HeadingText>getRandomBytesAsync:</HeadingText>
        <MonoText>{JSON.stringify(this.state.randomAsync)}</MonoText>

        <HeadingText>UUID:</HeadingText>
        <MonoText>{JSON.stringify(this.state.uuid)}</MonoText>
      </ScrollView>
    );
  }
}
