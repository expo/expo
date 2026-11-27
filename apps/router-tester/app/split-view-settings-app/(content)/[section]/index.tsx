import { useLocalSearchParams, useRouter } from 'expo-router';
import { PlatformColor, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  SettingsGroup,
  SettingsIcon,
  SettingsRow,
  findSection,
  sectionGroups,
  settingsStyles,
} from '@/components/split-view-settings';

export default function SectionScreen() {
  const router = useRouter();
  const { section: id } = useLocalSearchParams<{ section: string }>();
  const section = findSection(id);
  if (!section) {
    return <Text>Setting not found</Text>;
  }
  return (
    <ScrollView
      testID="split-view-settings-section"
      style={settingsStyles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={settingsStyles.content}>
      <SettingsGroup>
        <View style={styles.hero}>
          <SettingsIcon icon={section.icon} color={section.color} />
          <Text style={styles.heroTitle}>{section.title}</Text>
          <Text style={styles.heroText}>
            Manage {section.title} settings. Pushes stay in the content column.
          </Text>
        </View>
      </SettingsGroup>
      {sectionGroups(section).map((group, index) => (
        <SettingsGroup key={index}>
          {group.map((item) => (
            <SettingsRow
              key={item}
              title={item}
              chevron
              onPress={() => router.push(`/split-view-settings-app/${id}/${item}`)}
            />
          ))}
        </SettingsGroup>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, padding: 20 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: PlatformColor('label') },
  heroText: { fontSize: 15, textAlign: 'center', color: PlatformColor('secondaryLabel') },
});
