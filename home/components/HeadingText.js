import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const HeadingText = React.memo(({ style, ...props }) => (
  <View style={styles.container}>
    <Text style={[styles.headingText, style]} {...props} />
  </View>
));

export default HeadingText;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  headingText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
