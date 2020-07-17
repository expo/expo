import * as React from 'react';
import { Platform } from 'react-native';
import { NavigationInjectedProps, withNavigation } from 'react-navigation';

import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> & NavigationInjectedProps;

function QRCodeButton({ navigation, ...props }: Props) {
  const handlePressAsync = async () => {
    if (await requestCameraPermissionsAsync()) {
      navigation.navigate('QRCode');
    } else {
      alert('In order to use the QR Code scanner you need to provide camera permissions');
    }
  };
  return (
    <ListItem
      icon={Platform.OS === 'ios' ? 'ios-qr-scanner' : 'md-qr-scanner'}
      title="Scan QR Code"
      subtitle="Open your projects without typing"
      onPress={handlePressAsync}
      {...props}
    />
  );
}

export default withNavigation(QRCodeButton);
