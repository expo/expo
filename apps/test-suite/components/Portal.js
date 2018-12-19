import React from 'react';
import { View } from 'react-native';

export default class Portal extends React.PureComponent {
  render() {
    const styles = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgb(255, 255, 255)',
      opacity: this.props.isVisible ? 0.5 : 0,
    };

    return (
      <View style={styles} pointerEvents="none">
        {this.props.children}
      </View>
    );
  }
}
