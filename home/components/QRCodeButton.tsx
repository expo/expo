import * as React from 'react';
import { Platform } from 'react-native';
import { withNavigation, NavigationInjectedProps } from 'react-navigation';

import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> & NavigationInjectedProps;

class QRCodeButton extends React.Component<Props> {
  render() {
    return (
      <ListItem
        icon={Platform.OS === 'ios' ? 'ios-qr-scanner' : 'md-qr-scanner'}
        title="Scan QR Code"
        subtitle="Open your projects without typing"
        onPress={this.handlePressAsync}
        {...this.props}
      />
    );
  }

  private handlePressAsync = async () => {
    if (await requestCameraPermissionsAsync()) {
      this.props.navigation.navigate('QRCode');
    } else {
      alert('In order to use the QR Code scanner you need to provide camera permissions');
    }
  };
}

export default withNavigation(QRCodeButton);
