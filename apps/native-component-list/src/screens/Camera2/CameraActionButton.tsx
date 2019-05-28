import * as React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { CameraActionButtonIcon } from './icons';

export default class CameraActionButton extends React.PureComponent<TouchableOpacityProps> {
  render() {
    return (
      <TouchableOpacity {...this.props}>
        <CameraActionButtonIcon />
      </TouchableOpacity>
    );
  }
}
