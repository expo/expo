import { spacing } from '@expo/styleguide-native';
import { useExpoTheme, Text, Spacer, View } from 'expo-dev-client-components';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

export function WarningBox({
  message,
  showLearnMore,
  onLearnMorePress,
}: {
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
    <View bg="warning" border="warning" rounded="large" padding="medium">
      <Text color="warning" type="InterRegular" size="medium">
        {message}
      </Text>
      {learnMoreButton}
    </View>
  );
}
