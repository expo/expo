import { StyleSheet, Text, View } from 'react-native';

import { MovieList } from '../../components/MovieList';

export default function MovieIndex() {
  return (
    <>
      <Text style={styles.subheader}>Movies</Text>
      <View style={styles.listRoot}>
        <MovieList />
      </View>
    </>
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
});
