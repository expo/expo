import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
    textAlign: 'center',
  },
});

export default function Page() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
      <Text
        testID="modal-title-regular"
        style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        Regular Modal (detent 0.4)
      </Text>

      <View style={{ maxWidth: 400, marginBottom: 32 }}>
        <Text style={{ marginBottom: 8 }}>
          This modal uses a single detent at 40% of the screen height. The buttons below open other
          examples or navigate elsewhere so you can test nested navigation behaviour.
        </Text>
      </View>

      <Pressable
        testID="open-sheet-radius"
        onPress={() => router.push('/sheet-radius')}
        style={[styles.button, { backgroundColor: '#5856D6' }]}>
        <Text style={styles.buttonText}>Open Sheet (radius 24)</Text>
      </Pressable>

      <Pressable
        testID="open-modal-transparent"
        onPress={() => router.push('/modal-transparent')}
        style={[styles.button, { backgroundColor: '#000' }]}>
        <Text style={styles.buttonText}>Open Transparent Modal</Text>
      </Pressable>

      <Pressable
        testID="navigate-root"
        onPress={() => router.navigate('/')}
        style={[styles.button, { backgroundColor: '#FF3B30' }]}>
        <Text style={styles.buttonText}>Navigate to root</Text>
      </Pressable>

      <Pressable
        testID="navigate-modal-margin"
        onPress={() => router.push('/modal-margin')}
        style={[styles.button, { backgroundColor: '#007AFF' }]}>
        <Text style={styles.buttonText}>Push to non-modal route</Text>
      </Pressable>
    </ScrollView>
  );
}
