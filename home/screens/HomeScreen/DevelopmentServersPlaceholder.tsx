import { spacing } from '@expo/styleguide-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Text, View } from 'expo-dev-client-components';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { DevelopmentServersOpenQR } from './DevelopmentServersOpenQR';
import { DevelopmentServersOpenURL } from './DevelopmentServersOpenURL';
import FeatureFlags from '../../FeatureFlags';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

type Props = {
  isAuthenticated: boolean;
};

export function DevelopmentServersPlaceholder({ isAuthenticated }: Props) {
  const navigation = useNavigation<NavigationProp<HomeStackRoutes>>();

  return isAuthenticated ? (
    <View bg="default" rounded="large" border="default" overflow="hidden">
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
            npx expo start
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
  ) : (
    <TouchableOpacity
      onPress={() => navigation.navigate('Account')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <View bg="default" border="default" rounded="large">
        <View padding="medium">
          <Text type="InterRegular" style={{ lineHeight: 20 }}>
            Press here to sign in to your Expo account and see the projects you have recently been
            working on.
          </Text>
        </View>
        {FeatureFlags.ENABLE_PROJECT_TOOLS && FeatureFlags.ENABLE_CLIPBOARD_BUTTON ? (
          <DevelopmentServersOpenURL />
        ) : null}
        {FeatureFlags.ENABLE_PROJECT_TOOLS && FeatureFlags.ENABLE_QR_CODE_BUTTON ? (
          <DevelopmentServersOpenQR />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
