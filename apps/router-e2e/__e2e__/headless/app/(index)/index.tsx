import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MovieList } from '../../components/MovieList';

export default function Home() {
  return (
    <View>
      <Text style={styles.header}>Home</Text>
      <Text style={styles.subheader}>Movies</Text>
      <View style={styles.listRoot}>
        <MovieList />
      </View>
      <Text style={styles.subheader}>Test pages</Text>
      <Link href="/tab-functions">Tab functions</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 62,
    marginBottom: 20,
    textDecorationLine: 'underline',
  },
  subheader: {
    fontSize: 24,
    marginVertical: 20,
  },
  listRoot: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 20,
  },
  listItem: {},
});
