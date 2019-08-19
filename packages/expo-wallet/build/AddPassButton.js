import { UnavailabilityError } from '@unimodules/core';
import React from 'react';
import { TouchableHighlight } from 'react-native';
import ExpoWalletAddPassButton from './ExpoWalletAddPassButton';
export default class AddPassButton extends React.Component {
    render() {
        if (!ExpoWalletAddPassButton) {
            throw new UnavailabilityError('expo-wallet', 'AddPassButton');
        }
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
        return (<TouchableHighlight {...touchableHighlightProps}>
        <ExpoWalletAddPassButton type={typeInt} style={{ flex: 1 }}/>
      </TouchableHighlight>);
    }
}
//# sourceMappingURL=AddPassButton.js.map