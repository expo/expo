// @flow

import React from 'react';
import { Text, View } from 'react-native';

export default class AppLoading extends React.Component<{}> {
  render() {
    return (
      <View>
        <Text>BarCodeScanner Component not supported on the web</Text>
      </View>
    );
  }
}
