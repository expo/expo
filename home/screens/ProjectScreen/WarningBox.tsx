import { spacing } from '@expo/styleguide-native';
import { useExpoTheme, Text, Spacer, Row, View } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { Ionicons } from '../../components/Icons';

export function WarningBox({
  title,
  message,
  showLearnMore,
  onLearnMorePress,
}: {
  title: string;
  message: string;
  showLearnMore?: boolean;
  onLearnMorePress?: () => void;
}) {
  const theme = useExpoTheme();

  const learnMoreButton = showLearnMore ? (
    <>
      <Spacer.Vertical size="small" />
      <TouchableOpacity
        onPress={onLearnMorePress}
        style={{
          padding: spacing[2],
          alignSelf: 'flex-start',
          backgroundColor: theme.button.tertiary.background,
          borderRadius: 4,
        }}>
        <Text type="InterSemiBold" style={{ color: theme.button.tertiary.foreground }} size="small">
          Learn more
        </Text>
      </TouchableOpacity>
    </>
  ) : null;
  return (
    <View bg="warning" border="warning" rounded="medium" padding="medium">
      <Row align="center">
        <Ionicons
          name={Platform.select({ ios: 'ios-warning', default: 'md-warning' })}
          size={18}
          lightColor={theme.text.warning}
          darkColor={theme.text.warning}
          style={{
            marginRight: 4,
          }}
        />
        <Text color="warning" type="InterSemiBold">
          {title}
        </Text>
      </Row>
      <Spacer.Vertical size="small" />
      <Text color="warning" type="InterRegular">
        {message}
      </Text>
      {learnMoreButton}
    </View>
  );
}
