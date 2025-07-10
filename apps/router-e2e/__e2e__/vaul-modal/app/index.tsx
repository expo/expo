import { router } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={{ alignItems: 'center' }}>
          <Pressable
            testID="open-modal"
            onPress={() => router.push('/modal')}
            style={[styles.button, { backgroundColor: '#007AFF' }]}>
            <Text style={styles.buttonText}>Sheet (0.5, 1)</Text>
          </Pressable>

          <Pressable
            testID="open-modal-multi"
            onPress={() => router.push('/modal-multi')}
            style={[styles.button, { backgroundColor: '#FF9500' }]}>
            <Text style={styles.buttonText}>Sheet (0.25, 0.5, 0.75, 0.98)</Text>
          </Pressable>

          <Pressable
            testID="open-sheet-fit"
            onPress={() => router.push('/sheet-fit')}
            style={[styles.button, { backgroundColor: '#FFCC00' }]}>
            <Text style={styles.buttonText}>Sheet (Fit To Contents)</Text>
          </Pressable>

          <Pressable
            testID="open-sheet-radius"
            onPress={() => router.push('/sheet-radius')}
            style={[styles.button, { backgroundColor: '#5AC8FA' }]}>
            <Text style={styles.buttonText}>Sheet (border radius 24)</Text>
          </Pressable>
        </View>

        <View style={{ marginLeft: 16, alignItems: 'center' }}>
          <Pressable
            testID="open-modal-regular"
            onPress={() => router.push('/modal-regular')}
            style={[styles.button, { backgroundColor: '#5856D6' }]}>
            <Text style={styles.buttonText}>Modal (Regular)</Text>
          </Pressable>
          <Pressable
            testID="open-modal-full"
            onPress={() => router.push('/modal-full')}
            style={[styles.button, { backgroundColor: '#34C759' }]}>
            <Text style={styles.buttonText}>Modal (Full Screen)</Text>
          </Pressable>

          <Pressable
            testID="open-modal-small"
            onPress={() => router.push('/modal-small')}
            style={[styles.button, { backgroundColor: '#FF2D55' }]}>
            <Text style={styles.buttonText}>Modal (fit content)</Text>
          </Pressable>

          <Pressable
            testID="open-modal-transparent"
            onPress={() => router.push('/modal-transparent')}
            style={[styles.button, { backgroundColor: '#000000' }]}>
            <Text style={styles.buttonText}>Modal (transparent)</Text>
          </Pressable>
          <Pressable
            testID="open-modal-multi"
            onPress={() => router.push('/[test]/modal-regular')}
            style={[styles.button, { backgroundColor: '#FF9500' }]}>
            <Text style={styles.buttonText}>Page</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

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
