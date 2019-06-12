import React from 'react';
import { StyleSheet, View } from 'react-native';

export default class DevIndicator extends React.PureComponent {
  render() {
    const { isActive, isNetworkAvailable, style } = this.props;
    let backgroundColor;
    if (isActive && isNetworkAvailable) {
      backgroundColor = '#00c100';
    } else if (!isNetworkAvailable) {
      backgroundColor = '#e0e057';
    } else {
      backgroundColor = '#ccc';
    }

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor,
          },
          style,
        ]}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
