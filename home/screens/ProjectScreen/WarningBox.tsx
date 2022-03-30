import { spacing } from '@expo/styleguide-native';
import { useExpoTheme, Text, Spacer, Row, View } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform } from 'react-native';

import { Ionicons } from '../../components/Icons';
import { PressableOpacity } from '../../components/PressableOpacity';

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
      <PressableOpacity
        onPress={onLearnMorePress}
        containerProps={{
          style: {
            padding: spacing[2],
            alignSelf: 'flex-start',
            backgroundColor: theme.button.tertiary.background,
          },
          rounded: 'small',
        }}>
        <Text type="InterSemiBold" style={{ color: theme.button.tertiary.foreground }} size="small">
          Learn more
        </Text>
      </PressableOpacity>
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
