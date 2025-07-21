import { iconSize, XIcon, InfoIcon, spacing } from '@expo/styleguide-native';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

export function UpgradeWarning() {
  const [isDismissed, setIsDismissed] = useState(false);
  const theme = useExpoTheme();
  const dismissUpgradeWarning = () => {
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <View bg="default" rounded="large" border="default" overflow="hidden">
        <Pressable onPress={dismissUpgradeWarning} style={styles.dismissButton}>
          <XIcon size={iconSize.regular} color={theme.icon.default} />
        </Pressable>
        <View padding="medium" style={styles.content}>
          <Row style={{ gap: spacing[1] }}>
            <InfoIcon size={iconSize.regular} color={theme.icon.default} />
            <Text type="InterBold" size="small">
              New Expo Go version coming soon!
            </Text>
          </Row>
          <Text size="small" type="InterRegular">
            A new version of Expo Go will be released to the store soon, and it will{' '}
            <Text size="small" type="InterSemiBold">
              only support SDK 54
            </Text>
            .
          </Text>
          <Text size="small" type="InterRegular">
            In order to ensure that you can upgrade at your own pace, we recommend{' '}
            <Text size="small" type="InterSemiBold" color="link">
              migrating to a development build
            </Text>
            .
          </Text>
          <Text size="small" type="InterRegular">
            To continue using this version of Expo Go, you can{' '}
            <Text size="small" type="InterSemiBold">
              disable automatic app updates
            </Text>{' '}
            from the App Store settings before the new version is released.
          </Text>
        </View>
      </View>
      <Spacer.Vertical size="medium" />
    </>
  );
}

const styles = StyleSheet.create({
  dismissButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    zIndex: 1,
  },
  content: {
    gap: spacing[1],
  },
});
