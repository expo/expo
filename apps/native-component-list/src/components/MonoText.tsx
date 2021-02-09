import { Code } from '@expo/html-elements';
import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, TextStyle } from 'react-native';

const MonoText: React.FunctionComponent<{
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}> = ({ children, containerStyle, textStyle }) => (
  <View style={[styles.container, containerStyle]}>
    <Code style={[styles.monoText, textStyle]}>{children}</Code>
  </View>
);

export default MonoText;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 6,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#666666',
  },
  monoText: {
    fontSize: 10,
  },
});
