import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps, View } from 'react-native';

import HeadingText from './HeadingText';

const DeprecatedHeading = ({ children, style }: PropsWithChildren<TextProps>) => (
  <View style={styles.container}>
    <Text style={styles.label}>Deprecated</Text>
    <HeadingText style={styles.text}>{children}</HeadingText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  label: {
    color: '#db5739',
    fontWeight: 'bold',
    fontSize: 10,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#616161',
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
    marginTop: -16,
  },
});

export default DeprecatedHeading;
