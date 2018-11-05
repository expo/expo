import React from 'react';
import { View } from 'react-native';

export default class DevIndicator extends React.PureComponent {
  render() {
    let backgroundColor;
    if (this.props.isActive && this.props.isNetworkAvailable) {
      backgroundColor = '#00c100';
    } else if (!this.props.isNetworkAvailable) {
      backgroundColor = '#e0e057';
    } else {
      backgroundColor = '#ccc';
    }

    return (
      <View
        style={[
          {
            width: 7,
            height: 7,
            backgroundColor,
            borderRadius: 3.5,
          },
          this.props.style,
        ]}
      />
    );
  }
}
