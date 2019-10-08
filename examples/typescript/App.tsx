import { LinearGradient } from 'expo';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

type State = {};

export default class App extends React.Component<any, State> {
  render() {
    return (
      <LinearGradient style={styles.container} colors={['yellow', 'blue']}>
        <Text style={{ fontWeight: 'bold', fontSize: 24 }}>
          Open up App.tsx to start working on your app!
        </Text>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
