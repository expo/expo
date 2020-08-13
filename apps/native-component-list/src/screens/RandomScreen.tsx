import React from 'react';
import { ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

type State = {
  uuid: any;
};

export default class RandomScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'Random',
  };

  readonly state: State = {
    uuid: uuidv4(),
  };

  render() {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.greyBackground }}
        contentContainerStyle={{ padding: 10 }}>
        <HeadingText>UUID:</HeadingText>
        <MonoText>{JSON.stringify(this.state.uuid)}</MonoText>
      </ScrollView>
    );
  }
}
