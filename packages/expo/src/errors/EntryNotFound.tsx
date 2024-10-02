import { StyleSheet, Text, View } from 'react-native';

export function EntryNotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.errorTitle}>Application Not Found</Text>
      <Text style={styles.errorDescription}>
        The application entrypoint "main" was not registered.
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
