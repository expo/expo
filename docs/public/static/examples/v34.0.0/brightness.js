import React from 'react';
import { View, Text } from 'react-native';
import * as Brightness from 'expo-brightness';
import * as Permissions from 'expo-permissions';

export default class App extends React.Component {
  componentDidMount = async () => {
    const { status } = await Permissions.askAsync(Permissions.SYSTEM_BRIGHTNESS);
    if (status === 'granted') {
      Brightness.setSystemBrightnessAsync(1);
    }
  };

  render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>Brightness Module Example</Text>
      </View>
    );
  }
}
