import { StyleSheet, Text, View } from 'react-native';

export default function NoMessage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No Message Selected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
});
