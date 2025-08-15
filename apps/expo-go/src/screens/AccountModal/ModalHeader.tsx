import { iconSize, spacing, XIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Row, useExpoTheme } from 'expo-dev-client-components';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CappedWidthContainerView } from '../../components/Views';

export function ModalHeader() {
  const theme = useExpoTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <Row
      justify="between"
      align="center"
      bg="default"
      style={{
        paddingHorizontal: 20,
        paddingTop: Platform.select({ ios: 12, android: 12 + insets.top }),
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.default,
      }}>
      <CappedWidthContainerView
        style={{
          flex: 0,
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignContent: 'center',
          alignItems: 'center',
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
      </CappedWidthContainerView>
    </Row>
  );
}
