import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function MovieIndex() {
  return (
    <View>
      <Text style={styles.subheader}>Movies</Text>
      <View style={styles.listRoot}>
        <Link href="/movies/toy story">Toy Story</Link>
        <Link href="/movies/Bugs life">A Bugs Life</Link>
        <Link href="/movies/Monsters Inc">Monsters Inc.</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subheader: {
    fontSize: 24,
    marginBottom: 20,
  },
  listRoot: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 20,
  },
  listItem: {},
});
