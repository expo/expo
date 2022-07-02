import { iconSize, spacing, XIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Row, useExpoTheme } from 'expo-dev-client-components';
import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

export function ModalHeader() {
  const theme = useExpoTheme();
  const navigation = useNavigation();

  return (
    <Row justify="between" align="center">
      <View padding="medium">
        <Text type="InterBold">Account</Text>
      </View>
      <Row>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ padding: spacing[2], borderRadius: 100 }}
          onPress={() => navigation.goBack()}>
          <XIcon size={iconSize.regular} color={theme.icon.default} />
        </TouchableOpacity>
        <View style={{ width: spacing[2] }} />
      </Row>
    </Row>
  );
}
