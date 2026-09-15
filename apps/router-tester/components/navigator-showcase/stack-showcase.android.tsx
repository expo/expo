import { Color } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// React Native's style types do not yet recognize Expo Router's opaque dynamic color values.
const colors = Object.fromEntries(
  Object.entries(Color.android.dynamic).map(([name, value]) => [name, value as string])
) as Record<keyof typeof Color.android.dynamic, string>;
const moods = [
  ['8:30 AM', 'Calm', 'Morning meditation, 10 minutes'],
  ['12:15 PM', 'Energized', 'Great lunch with a friend'],
  ['3:00 PM', 'Focused', 'Deep work session on the project'],
];

export default function StackShowcase() {
  return (
    <ScrollView
      accessibilityLabel="Navigator showcase: Stack"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.primaryContainer }]}>
        <Text style={[styles.display, { color: colors.primary }]}>Hello, Jordan</Text>
        <Text style={[styles.body, { color: colors.onPrimaryContainer }]}>
          Saturday, February 22
        </Text>
        <Text style={[styles.heading, { color: colors.onPrimaryContainer }]}>
          How are you feeling today?
        </Text>
        <View style={styles.chips}>
          {['Great', 'Good', 'Okay', 'Low'].map((mood) => (
            <Text key={mood} style={styles.chip}>
              {mood}
            </Text>
          ))}
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surfaceContainerHigh }]}>
        <View style={styles.row}>
          <Text style={styles.heading}>Daily Goals</Text>
          <Text style={{ color: colors.tertiary }}>2 of 3</Text>
        </View>
        <View style={styles.chips}>
          {['✓ Meditate', '✓ Journal', 'Exercise'].map((goal) => (
            <Text key={goal} style={styles.chip}>
              {goal}
            </Text>
          ))}
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: colors.secondaryContainer }]}>
        <Text style={[styles.heading, { color: colors.onSecondaryContainer }]}>Today's Mood</Text>
        <Text style={[styles.body, { color: colors.onSecondaryContainer }]}>
          You've been feeling mostly positive today
        </Text>
        <View style={styles.moodBar}>
          <View style={[styles.moodPositive, { backgroundColor: colors.primary }]} />
          <View style={[styles.moodFocused, { backgroundColor: colors.tertiary }]} />
        </View>
      </View>
      <Text style={styles.sectionTitle}>Today's Entries</Text>
      <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
        {moods.map(([time, mood, note], index) => (
          <View key={time} style={[styles.entry, index > 0 && styles.divider]}>
            <Text style={{ color: colors.primary, fontSize: 12 }}>{time}</Text>
            <Text style={styles.heading}>{mood}</Text>
            <Text style={styles.body}>{note}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 36 },
  hero: { borderRadius: 28, padding: 24, gap: 8 },
  display: { fontSize: 32, fontWeight: '500' },
  heading: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, color: '#555' },
  card: { borderRadius: 20, padding: 20, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(128,128,128,0.14)',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  moodBar: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginTop: 8 },
  moodPositive: { flex: 3 },
  moodFocused: { flex: 2 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  entry: { paddingVertical: 8, gap: 3 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#999' },
});
