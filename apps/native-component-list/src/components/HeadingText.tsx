import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps, View } from 'react-native';

const HeadingText = ({ children, style }: PropsWithChildren<TextProps>) => (
  <View style={styles.container}>
    <Text style={[styles.headingText, style]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  headingText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default HeadingText;
