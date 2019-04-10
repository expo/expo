import { Font } from 'expo';
import React from 'react';
import { Image, Text, StyleSheet, View } from 'react-native';

export default class App extends React.Component {
  state = { loaded: false };

  async componentDidMount() {
    await Font.loadAsync({ custom: require('../assets/comic.ttf') });
    this.setState({ loaded: true });
  }
  render() {
    if (!this.state.loaded) {
      return null;
    }
    return (
      <View style={{ flex: 1 }}>
        <Text
          accessibilityLabel="target-000"
          style={{ width: 300, fontFamily: 'custom', fontSize: 24, color: 'red' }}>
          ABSDEFGHIJKLMNOPQRSTUVWXYZ
        </Text>
      </View>
    );
  }
}
