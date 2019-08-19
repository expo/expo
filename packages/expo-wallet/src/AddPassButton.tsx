import React from 'react';
import { TouchableHighlight, TouchableHighlightProps } from 'react-native';
import ExpoWalletAddPassButton from './ExpoWalletAddPassButton';

export interface AddPassButtonProps extends TouchableHighlightProps {
  type?: 'black' | 'blackOutline';
}

export default class AddPassButton extends React.Component<AddPassButtonProps> {
  render() {
    const { type, ...touchableHighlightProps } = this.props;
    let typeInt = 0;
    switch (type) {
      case 'black':
        typeInt = 0;
        break;
      case 'blackOutline':
        typeInt = 1;
        break;
    }
    return (
      <TouchableHighlight {...touchableHighlightProps}>
        <ExpoWalletAddPassButton type={typeInt} style={{ flex: 1 }} />
      </TouchableHighlight>
    );
  }
}
