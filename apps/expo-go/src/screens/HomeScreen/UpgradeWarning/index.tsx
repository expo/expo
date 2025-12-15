import { iconSize, XIcon, WarningIcon, spacing } from '@expo/styleguide-native';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';

import { AndroidMessage } from './AndroidMessage';
import { IosMessage } from './IosMessage';
import { shouldShowUpgradeWarningAsync } from './utils';

type Props = {
  collapsible?: boolean;
};

export function UpgradeWarning({ collapsible = false }: Props) {
  const [shouldShow, setShouldShow] = useState(false);
  const [betaSdkVersion, setBetaSdkVersion] = useState<string | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(collapsible);
  const theme = useExpoTheme();
  const dismissUpgradeWarning = () => {
    setShouldShow(false);
  };

  useEffect(() => {
    shouldShowUpgradeWarningAsync().then(({ shouldShow, betaSdkVersion }) => {
      setShouldShow(shouldShow);
      setBetaSdkVersion(betaSdkVersion);
    });
  }, []);

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <View bg="warning" rounded="large" border="warning" overflow="hidden">
        <Pressable onPress={dismissUpgradeWarning} style={styles.dismissButton}>
          <XIcon size={iconSize.regular} color={theme.icon.default} />
        </Pressable>
        <View padding="medium" style={styles.content}>
          <Row style={{ gap: spacing[2] }}>
            <WarningIcon size={iconSize.small} color={theme.status.warning} />
            <Text type="InterBold" size="small">
              New Expo Go version coming soon!
            </Text>
          </Row>
          <Text size="small" type="InterRegular">
            A new version of Expo Go will be released to the store soon, and it will{' '}
            <Text size="small" type="InterSemiBold">
              only support SDK {betaSdkVersion}
            </Text>
            .
          </Text>
          {!isCollapsed && (Platform.OS === 'ios' ? <IosMessage /> : <AndroidMessage />)}

          {collapsible && (
            <Pressable onPress={() => setIsCollapsed(!isCollapsed)}>
              <Text size="small" type="InterBold" style={{ textDecorationLine: 'underline' }}>
                {isCollapsed ? 'Show more' : 'Show less'}
              </Text>
            </Pressable>
          )}
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
