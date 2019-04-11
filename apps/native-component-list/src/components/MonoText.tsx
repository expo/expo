import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';

const MonoText: React.FunctionComponent<{
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
}> = ({ children, containerStyle, textStyle }) => (
  <View style={[styles.container, containerStyle]}>
    <Text style={[styles.monoText, textStyle]}>{children}</Text>
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
    fontFamily: 'space-mono',
    fontSize: 10,
  },
});
