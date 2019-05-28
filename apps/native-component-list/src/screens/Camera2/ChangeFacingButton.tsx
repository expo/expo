import * as React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { ChangeFacingIcon } from './icons';

export default class ChangeFacingButton extends React.PureComponent<TouchableOpacityProps> {
  render() {
    return (
      <TouchableOpacity {...this.props}>
        <ChangeFacingIcon />
      </TouchableOpacity>
    );
  }
}
