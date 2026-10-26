import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function EmptyMessage() {
  return (
    <View style={styles.container}>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="square.and.pencil" />
        <Stack.Toolbar.Button icon="magnifyingglass" />
      </Stack.Toolbar>
      <Text style={styles.title}>Select a message</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600' },
});
