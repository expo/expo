import { PlatformColor, StyleSheet, Text, View } from 'react-native';

import { settingsStyles } from '@/components/split-view-settings';

export default function NoSection() {
  return (
    <View style={[settingsStyles.screen, styles.container]}>
      <Text style={styles.text}>Select a setting</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 17, color: PlatformColor('secondaryLabel') },
});
