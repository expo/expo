import { spacing } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import FeatureFlags from 'FeatureFlags';
import { Text, View } from 'expo-dev-client-components';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { DevelopmentServersOpenQR } from './DevelopmentServersOpenQR';
import { DevelopmentServersOpenURL } from './DevelopmentServersOpenURL';

type Props = {
  isAuthenticated: boolean;
};

export function DevelopmentServersPlaceholder({ isAuthenticated }: Props) {
  const navigation = useNavigation();

  return (
    <View bg="default" rounded="large" border="default" overflow="hidden">
      {isAuthenticated ? (
        <>
          <View padding="medium">
            <Text type="InterRegular" size="small" style={{ marginBottom: spacing[2] }}>
              Start a local development server with:
            </Text>
            <View
              border="default"
              padding="medium"
              rounded="medium"
              bg="secondary"
              style={{ marginBottom: spacing[2] }}>
              <Text size="small" type="mono">
                expo start
              </Text>
            </View>
            <Text size="small" type="InterRegular">
              Select the local server when it appears here.
            </Text>
          </View>
          {FeatureFlags.ENABLE_PROJECT_TOOLS && FeatureFlags.ENABLE_CLIPBOARD_BUTTON ? (
            <DevelopmentServersOpenURL />
          ) : null}
          {FeatureFlags.ENABLE_PROJECT_TOOLS && FeatureFlags.ENABLE_QR_CODE_BUTTON ? (
            <DevelopmentServersOpenQR />
          ) : null}
        </>
      ) : (
        <TouchableOpacity
          onPress={() => navigation.navigate('Account')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View bg="default" padding="medium" border="default" rounded="large">
            <Text type="InterRegular" style={{ lineHeight: 20 }}>
              Sign in to your Expo account to see the projects you have recently been working on.
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
