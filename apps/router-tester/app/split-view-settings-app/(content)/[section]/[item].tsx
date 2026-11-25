import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { PlatformColor, ScrollView, StyleSheet, Switch, Text } from 'react-native';

import { SettingsGroup, SettingsRow, settingsStyles } from '@/components/split-view-settings';

export default function ItemScreen() {
  const { section, item } = useLocalSearchParams<{ section: string; item: string }>();
  const [enabled, setEnabled] = useState(true);
  return (
    <ScrollView
      testID="split-view-settings-item"
      style={settingsStyles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={settingsStyles.content}>
      <SettingsGroup>
        <SettingsRow
          title={item}
          accessory={
            <Switch accessibilityLabel={item} value={enabled} onValueChange={setEnabled} />
          }
        />
      </SettingsGroup>
      <Text style={styles.footer}>
        Path: /split-view-settings-app/{section}/{item}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  footer: { fontSize: 13, paddingHorizontal: 16, color: PlatformColor('secondaryLabel') },
});
