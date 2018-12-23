import React from 'react';
import { View, StyleSheet } from 'react-native';

export default class Portal extends React.PureComponent {
  render() {
    const style = StyleSheet.flatten([
      styles.container,
      { opacity: this.props.isVisible ? 0.5 : 0 },
    ]);

    return (
      <View style={style} pointerEvents="none">
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(255, 255, 255)',
  },
});
