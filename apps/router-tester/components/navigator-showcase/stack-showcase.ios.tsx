import { Stack } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const movies = [
  { title: 'Dune: Part Two', year: '2024', rating: '8.5', colors: ['#bd7a35', '#362418'] },
  { title: 'Inception', year: '2010', rating: '8.8', colors: ['#546d82', '#142738'] },
  { title: 'The Matrix', year: '1999', rating: '8.7', colors: ['#4c8058', '#0d2514'] },
  { title: 'Parasite', year: '2019', rating: '8.5', colors: ['#657488', '#18212b'] },
  { title: 'Oppenheimer', year: '2023', rating: '8.2', colors: ['#c66c38', '#33170d'] },
  { title: 'Spirited Away', year: '2001', rating: '8.5', colors: ['#77aeb0', '#1f5055'] },
];

export default function StackShowcase() {
  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="bookmark" accessibilityLabel="Watchlist" />
        <Stack.Toolbar.Button icon="magnifyingglass" accessibilityLabel="Search" />
      </Stack.Toolbar>
      <FlatList
        accessibilityLabel="Navigator showcase: Stack"
        data={movies}
        numColumns={2}
        keyExtractor={(movie) => movie.title}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={[styles.poster, { backgroundColor: item.colors[0] }]}>
              <View style={[styles.posterInset, { backgroundColor: item.colors[1] }]}>
                <Text style={styles.posterNumber}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.posterTitle}>{item.title}</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.metadata}>
              {item.year} · ★ {item.rating}
            </Text>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 18, paddingBottom: 32 },
  row: { gap: 12 },
  card: { flex: 1 },
  poster: { aspectRatio: 0.68, borderRadius: 14, padding: 8 },
  posterInset: { flex: 1, borderRadius: 9, padding: 14, justifyContent: 'space-between' },
  posterNumber: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '700' },
  posterTitle: { color: 'white', fontSize: 22, lineHeight: 23, fontWeight: '800' },
  title: { marginTop: 8, fontSize: 15, fontWeight: '600' },
  metadata: { marginTop: 2, color: '#777', fontSize: 13 },
});
