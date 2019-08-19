import { UnavailabilityError } from '@unimodules/core';
import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import ExpoWalletAddPassButton from './ExpoWalletAddPassButton';
export default class AddPassButton extends React.Component {
    render() {
        if (!ExpoWalletAddPassButton) {
            throw new UnavailabilityError('expo-wallet', 'AddPassButton');
        }
        const { type, style, ...touchableWithoutFeedbackProps } = this.props;
        let typeInt = 0;
        switch (type) {
            case 'black':
                typeInt = 0;
                break;
            case 'blackOutline':
                typeInt = 1;
                break;
        }
        // We use `TouchableWithoutFeedback` here because `ExpoWalletAddPassButton`
        // (i.e., `PKAddPassButton`) already has its own touch effect.
        // Also note that `TouchableWithoutFeedback` does not have a `style` property,
        // so we apply `style` to `ExpoWalletAddPassButton` directly.
        return (<TouchableWithoutFeedback {...touchableWithoutFeedbackProps}>
        <ExpoWalletAddPassButton type={typeInt} style={style}/>
      </TouchableWithoutFeedback>);
    }
}
//# sourceMappingURL=AddPassButton.js.map