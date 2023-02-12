import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Divider({ text }: { text: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  line: {
    backgroundColor: 'black',
    height: 1,
    flex: 1,
  },
  text: {
    paddingHorizontal: 5,
    fontSize: 8,
  },
});
