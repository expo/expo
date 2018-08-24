import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ifStyle = s => (s === undefined ? [] : [s]);

export default class MonoText extends React.Component {
  render() {
    const { containerStyle, textStyle } = this.props;
    return (
      <View style={[styles.container, ...ifStyle(containerStyle)]}>
        <Text style={[styles.monoText, ...ifStyle(textStyle)]}>{this.props.children}</Text>
      </View>
    );
  }
}

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
