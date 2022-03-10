import { iconSize, QrCodeIcon, spacing } from '@expo/styleguide-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import FeatureFlags from 'FeatureFlags';
import { Divider, Row, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform } from 'react-native';

import { PressableOpacity } from '../../components/PressableOpacity';
import { ModalStackRoutes } from '../../navigation/Navigation.types';
import {
  alertWithCameraPermissionInstructions,
  requestCameraPermissionsAsync,
} from '../../utils/PermissionUtils';
import { DevelopmentServersOpenURL } from './DevelopmentServersOpenURL';

export function DevelopmentServersPlaceholder() {
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
    <View bg="default" rounded="large" border="hairline" overflow="hidden">
      <View padding="medium">
        <Text size="small" style={{ marginBottom: spacing[2] }}>
          Start a local development server with:
        </Text>
        <View
          border="default"
          padding="medium"
          rounded="medium"
          bg="secondary"
          style={{ marginBottom: spacing[2] }}>
          <Text size="small" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
            expo start
          </Text>
        </View>
        <Text size="small">Then, select the local server when it appears here.</Text>
      </View>
      {FeatureFlags.ENABLE_PROJECT_TOOLS && FeatureFlags.ENABLE_CLIPBOARD_BUTTON ? (
        <DevelopmentServersOpenURL />
      ) : null}
      {FeatureFlags.ENABLE_PROJECT_TOOLS && FeatureFlags.ENABLE_QR_CODE_BUTTON ? (
        <>
          <Divider />
          <PressableOpacity onPress={handleQRPressAsync}>
            <Row padding="medium" align="center">
              <QrCodeIcon
                size={iconSize.small}
                style={{ marginRight: spacing[2] }}
                color={theme.icon.default}
              />
              <Text>Scan QR code</Text>
            </Row>
          </PressableOpacity>
        </>
      ) : null}
    </View>
  );
}
