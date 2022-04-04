import { spacing } from '@expo/styleguide-native';
import FeatureFlags from 'FeatureFlags';
import { Text, View } from 'expo-dev-client-components';
import * as React from 'react';

import { DevelopmentServersOpenQR } from './DevelopmentServersOpenQR';
import { DevelopmentServersOpenURL } from './DevelopmentServersOpenURL';

export function DevelopmentServersPlaceholder() {
  return (
    <View bg="default" rounded="large" border="hairline" overflow="hidden">
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
    </View>
  );
}
