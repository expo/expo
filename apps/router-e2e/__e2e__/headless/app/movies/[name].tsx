import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MovieList } from '../../components/MovieList';

export default function Movie() {
  const { name } = useLocalSearchParams();
  const title = name.toString();

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title }} />
      <Text style={styles.header}>{name}</Text>
      <View style={styles.listRoot}>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
          est laborum.
        </Text>
      </View>
      <Text style={styles.subheader}>Other Movies</Text>
      <MovieList />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
  },
  listRoot: {
    justifyContent: 'flex-start',
  },
  subheader: {
    fontSize: 24,
    marginBottom: 20,
  },
});
