import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default class HeadingText extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={[styles.headingText, this.props.style]}>{this.props.children}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  headingText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
