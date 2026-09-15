import { ScrollView, StyleSheet, Text, View } from 'react-native';

const albums = [
  ['Afterglow', 'Luna Grey', '#6b4f8a'],
  ['Blue Hours', 'Northbound', '#316b83'],
  ['Open Roads', 'The Coastlines', '#ba7338'],
  ['Soft Focus', 'Violet Days', '#a95062'],
];

export default function NativeTabsHome() {
  return (
    <ScrollView
      accessibilityLabel="Navigator showcase: Native Tabs"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>FEATURED ALBUM</Text>
      <Text style={styles.heroTitle}>Night Signals</Text>
      <Text style={styles.artist}>Neon Coast</Text>
      <View style={styles.hero}>
        <Text style={styles.heroNote}>♪</Text>
        <Text style={styles.heroCaption}>NIGHT SIGNALS</Text>
      </View>
      <Text style={styles.section}>Recently Played</Text>
      <View style={styles.grid}>
        {albums.map(([title, artist, color]) => (
          <View key={title} style={styles.album}>
            <View style={[styles.cover, { backgroundColor: color }]}>
              <Text style={styles.coverNote}>♪</Text>
            </View>
            <Text style={styles.albumTitle}>{title}</Text>
            <Text style={styles.artist}>{artist}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingTop: 28, paddingBottom: 160 },
  eyebrow: { color: '#777', fontSize: 12, fontWeight: '700', letterSpacing: 0.7 },
  heroTitle: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  artist: { color: '#777', fontSize: 13, marginTop: 2 },
  hero: {
    height: 190,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#20253f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNote: { color: '#bb9bff', fontSize: 64 },
  heroCaption: { color: 'white', fontWeight: '800', letterSpacing: 4, marginTop: 8 },
  section: { fontSize: 22, fontWeight: '800', marginTop: 26, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  album: { width: '47%' },
  cover: { aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  coverNote: { color: 'rgba(255,255,255,0.8)', fontSize: 44 },
  albumTitle: { marginTop: 7, fontSize: 14, fontWeight: '600' },
});
