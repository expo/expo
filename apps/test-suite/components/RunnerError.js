import { Constants } from 'expo';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default class RunnerError extends React.Component {
  render() {
    const { children } = this.props;

    return (
      <View style={styles.container}>
        <Text style={styles.text}>{children}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight || 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'red',
  },
});
