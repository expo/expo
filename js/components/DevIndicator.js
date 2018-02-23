import React from 'react';
import { View } from 'react-native';

export default class DevIndicator extends React.Component {
  render() {
    return (
      <View
        style={[
          {
            width: 7,
            height: 7,
            backgroundColor: '#00c100',
            borderRadius: 3.5,
          },
          this.props.style,
        ]}
      />
    );
  }
}
