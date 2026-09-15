import { Color } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// React Native's style types do not yet recognize Expo Router's opaque dynamic color values.
const colors = Object.fromEntries(
  Object.entries(Color.android.dynamic).map(([name, value]) => [name, value as string])
) as Record<keyof typeof Color.android.dynamic, string>;
const books = [
  ['The Long Way Home', 'Mira Chen', '68%'],
  ['The Quiet Atlas', 'Sam Rivera', '42%'],
];

export default function NativeTabsHome() {
  return (
    <ScrollView
      accessibilityLabel="Navigator showcase: Native Tabs"
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.primaryContainer }]}>
        <Text style={[styles.title, { color: colors.primary }]}>Good afternoon</Text>
        <Text style={[styles.body, { color: colors.onPrimaryContainer }]}>
          Pick up where you left off, or discover something new.
        </Text>
      </View>
      <Text style={styles.section}>Continue Reading</Text>
      <View style={styles.bookRow}>
        {books.map(([title, author, progress], index) => (
          <View key={title} style={[styles.book, { backgroundColor: colors.surfaceContainerHigh }]}>
            <View
              style={[
                styles.cover,
                { backgroundColor: index ? colors.tertiaryContainer : colors.secondaryContainer },
              ]}>
              <Text style={styles.coverLetter}>{title[0]}</Text>
            </View>
            <Text style={styles.bookTitle}>{title}</Text>
            <Text style={styles.body}>{author}</Text>
            <View style={styles.progress}>
              <View
                style={[styles.progressFill, { width: progress, backgroundColor: colors.primary }]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.primary }]}>{progress}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.section}>Recommended for You</Text>
      <View style={[styles.stats, { backgroundColor: colors.secondaryContainer }]}>
        <Text style={styles.section}>This Month</Text>
        <View style={styles.statRow}>
          {[
            ['4', 'Books'],
            ['847', 'Pages'],
            ['12h', 'Read time'],
          ].map(([value, label]) => (
            <View key={label} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.secondary }]}>{value}</Text>
              <Text style={styles.body}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 120 },
  hero: { borderRadius: 26, padding: 24, gap: 8 },
  title: { fontSize: 28, fontWeight: '600' },
  body: { color: '#666', fontSize: 13 },
  section: { fontSize: 20, fontWeight: '700' },
  bookRow: { flexDirection: 'row', gap: 12 },
  book: { flex: 1, borderRadius: 18, padding: 12 },
  cover: {
    height: 118,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  coverLetter: { fontSize: 52, fontWeight: '800', opacity: 0.35 },
  bookTitle: { fontSize: 15, fontWeight: '700' },
  progress: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: { height: '100%' },
  progressText: { fontSize: 12, fontWeight: '700', marginTop: 5 },
  stats: { borderRadius: 20, padding: 20, gap: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
});
