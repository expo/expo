import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

const styles = StyleSheet.create({
  button: {
    width: 180,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
});

export default function Page() {
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text
        testID="modal-title-full"
        style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Full Screen Modal
      </Text>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Text>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Text>
      <Pressable
        testID="open-modal-regular"
        onPress={() => router.push('/[test]/sheet-radius')}
        style={[styles.button, { backgroundColor: '#5856D6' }]}>
        <Text style={styles.buttonText}>Sheet (border radius 24)</Text>
      </Pressable>
      <Pressable
        testID="open-modal-regular"
        onPress={() => router.push('/modal-transparent')}
        style={[styles.button, { backgroundColor: '#000000' }]}>
        <Text style={styles.buttonText}>Modal (transparent)</Text>
      </Pressable>
    </ScrollView>
  );
}
