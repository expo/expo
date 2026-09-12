import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Sheet() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.action}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>NativeTabs form sheet</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.action}>Save</Text>
        </Pressable>
      </View>
      <Text style={styles.description}>The input opens the keyboard automatically.</Text>
      <TextInput
        autoFocus
        accessibilityLabel="Your name"
        placeholder="Your name"
        placeholderTextColor="#71717a"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: {
    color: '#2563eb',
    fontSize: 17,
    fontWeight: '600',
  },
  title: {
    color: '#18181b',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: '#52525b',
  },
  input: {
    borderRadius: 12,
    backgroundColor: '#f4f4f5',
    color: '#18181b',
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
