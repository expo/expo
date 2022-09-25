import { iconSize, QrCodeIcon, spacing } from '@expo/styleguide-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Divider, Row, Text, useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { ModalStackRoutes } from '../../navigation/Navigation.types';
import {
  alertWithCameraPermissionInstructions,
  requestCameraPermissionsAsync,
} from '../../utils/PermissionUtils';

export function DevelopmentServersOpenQR() {
  const theme = useExpoTheme();

  const navigation = useNavigation<NavigationProp<ModalStackRoutes>>();

  const handleQRPressAsync = async () => {
    if (await requestCameraPermissionsAsync()) {
      navigation.navigate('QRCode');
    } else {
      await alertWithCameraPermissionInstructions();
    }
  };

  return (
    <>
      <Divider style={{ height: 1 }} />
      <TouchableOpacity onPress={handleQRPressAsync}>
        <Row padding="medium" align="center">
          <QrCodeIcon
            size={iconSize.small}
            style={{ marginRight: spacing[2] }}
            color={theme.icon.default}
          />
          <Text type="InterRegular">Scan QR code</Text>
        </Row>
      </TouchableOpacity>
    </>
  );
}
