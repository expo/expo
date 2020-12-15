import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Platform } from 'react-native';

import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem>;

function QRCodeButton(props: Props) {
  const navigation = useNavigation();

  const handlePressAsync = async () => {
    if (await requestCameraPermissionsAsync()) {
      navigation.navigate('QRCode');
    } else {
      alert('In order to use the QR Code scanner you need to provide camera permissions');
    }
  };
  return (
    <ListItem
      icon={Platform.OS === 'ios' ? 'ios-qr-scanner' : 'qr-code-outline'}
      title="Scan QR Code"
      subtitle="Open your projects without typing"
      onPress={handlePressAsync}
      last
      {...props}
    />
  );
}

export default QRCodeButton;
