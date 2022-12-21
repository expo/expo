import { getRandomBytes, getRandomBytesAsync } from 'expo-random';
import React from 'react';
import { ScrollView } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

// Placeholder polyfill
if (!global.crypto) {
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

export default class RandomScreen extends React.Component<object, State> {
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
