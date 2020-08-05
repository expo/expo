import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Platform } from 'react-native';

import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';
import ListItem from './ListItem';

import Animated from 'react-native-reanimated'
const {proc} = Animated;
type Props = React.ComponentProps<typeof ListItem>;

function QRCodeButton(props: Props) {
  
  // @ts-ignore
  const navigation = useNavigation();

  const handlePressAsync = async () => {
    if (await requestCameraPermissionsAsync()) {
      navigation.navigate('QRCode');
    } else {
      alert('In order to use the QR Code scanner you need to provide camera permissions');
    }
  };
  return (
    (
    // @ts-ignore
    //style={{padding: f()}}
    <Animated.View >
      <ListItem
      icon={Platform.OS === 'ios' ? 'ios-qr-scanner' : 'md-qr-scanner'}
      title="Scan QR Code"
      subtitle="Open your projects without typing"
      onPress={handlePressAsync}
      {...props}
    />
    </Animated.View>)
  );
}

export default QRCodeButton;
