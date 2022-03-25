import { iconSize, spacing, XIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Row, useExpoTheme } from 'expo-dev-client-components';
import React from 'react';

import { PressableOpacity } from '../../components/PressableOpacity';

export function ModalHeader() {
  const theme = useExpoTheme();
  const navigation = useNavigation();

  return (
    <Row justify="between" align="center">
      <View padding="medium">
        <Text type="InterBold">Account</Text>
      </View>
      <Row>
        <PressableOpacity
          hitSlop={16}
          borderRadius={100}
          style={{ padding: spacing[2] }}
          onPress={() => navigation.goBack()}>
          <XIcon size={iconSize.regular} color={theme.icon.default} />
        </PressableOpacity>
        <View style={{ width: spacing[2] }} />
      </Row>
    </Row>
  );
}
