import { iconSize, spacing, XIcon } from '@expo/styleguide-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Text, Row, View, useExpoTheme } from 'expo-dev-client-components';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CappedWidthContainerView } from '../../components/Views';

type Props = {
  title?: string;
  onBack?: () => void;
};

export function ModalHeader({ title = 'Account', onBack }: Props) {
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
        {onBack ? (
          <>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ padding: spacing[2], marginLeft: -8 }}
              onPress={onBack}>
              <Ionicons name="chevron-back" size={iconSize.regular} color={theme.icon.default} />
            </TouchableOpacity>
            <Text type="InterBold" size="large">
              {title}
            </Text>
            <View style={{ width: iconSize.regular + spacing[2] }} />
          </>
        ) : (
          <>
            <Text type="InterBold" size="large">
              {title}
            </Text>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ padding: spacing[2], marginRight: -8 }}
              onPress={() => navigation.goBack()}>
              <XIcon size={iconSize.regular} color={theme.icon.default} />
            </TouchableOpacity>
          </>
        )}
      </CappedWidthContainerView>
    </Row>
  );
}
