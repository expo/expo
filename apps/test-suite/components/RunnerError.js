import { Constants } from 'expo';
import React from 'react';
import { Text, View } from 'react-native';

export default class RunnerError extends React.Component {
  render() {
    const { children } = this.props;

    return (
      <View
        style={{
          flex: 1,
          marginTop: Constants.statusBarHeight || 18,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ color: 'red' }}>{children}</Text>
      </View>
    );
  }
}
