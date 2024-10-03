import { StyleSheet, Text, View } from 'react-native';

export function AppEntryNotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.errorTitle}>App entry not found</Text>
      <Text style={styles.errorDescription}>
        The app entry point "main" was not registered. It might be caused by an uncaught error thrown from the top-level code. See the logs from CLI for more details.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});
