import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function Foo({
  button = () => {
    return <Text>Foo</Text>;
  },
}) {
  return <>{button()}</>;
}

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Foo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
