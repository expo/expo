import { Code } from '@expo/html-elements';
import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle, TextStyle } from 'react-native';

type Props = PropsWithChildren<{
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}>;

const MonoText = ({ children, containerStyle, textStyle }: Props) => (
  <View style={[styles.container, containerStyle]}>
    <Code style={[styles.monoText, textStyle]}>{children}</Code>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 6,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  monoText: {
    fontSize: 10,
  },
});

export default MonoText;
