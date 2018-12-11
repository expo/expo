// @flow
import React from 'react';
import { Text, View } from 'react-native';

export default class BarCodeScanner extends React.Component<{}> {
  static Constants = {
    BarCodeType: {},
    Type: {},
  };

  static ConversionTables = {
    type: {},
  };

  render() {
    return (
      <View>
        <Text>BarCodeScanner Component not supported on the web</Text>
      </View>
    );
  }
}

export const Constants = BarCodeScanner.Constants;
