import { iconSize, spacing, XIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Row, useExpoTheme } from 'expo-dev-client-components';
import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

export function ModalHeader() {
  const theme = useExpoTheme();
  const navigation = useNavigation();

  return (
    <Row
      justify="between"
      align="center"
      bg="default"
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.default,
      }}>
      <Text type="InterBold" size="large">
        Account
      </Text>
      <TouchableOpacity
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ padding: spacing[2], marginRight: -8 }}
        onPress={() => navigation.goBack()}>
        <XIcon size={iconSize.regular} color={theme.icon.default} />
      </TouchableOpacity>
    </Row>
  );
}
