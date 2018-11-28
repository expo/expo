import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import firebase from 'expo-firebase-app';

export default class App extends React.Component {
  componentDidMount() {
    console.log(firebase.analytics());
  }
  render() {
    return (
      <View style={styles.container}>
        <Text>Expo Firebase</Text>
      </View>
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
