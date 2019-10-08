import { LinearGradient } from 'expo';
import React, { Component } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
  web: 'Save (⌘S or ⌃S) to see your changes in the browser!',
});

export default class App extends Component {
  render() {
    return (
      <LinearGradient style={styles.container} colors={['#BAD9F9', '#66b9f4']}>
        <Text style={styles.welcome}>Welcome to Expo!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
