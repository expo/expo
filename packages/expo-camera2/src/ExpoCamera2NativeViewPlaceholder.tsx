import * as React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export default class ExpoCamera2NativeViewPlaceholder extends React.Component<ViewProps> {
  render() {
    return (
      <View {...this.props} style={[this.props.style, styles.placeholder]}/>
    )
  }
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'rgba(70, 70, 60, 0.8)',
  },
});
