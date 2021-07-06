import React from 'react';
import { View, ViewProps } from 'react-native';

type Props = ViewProps & {
  isActive: boolean;
  isNetworkAvailable: boolean;
};

export default class DevIndicator extends React.PureComponent<Props> {
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
