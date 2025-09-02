import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  button: {
    width: 180,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#333',
    color: 'white',
    fontSize: 14,
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

      <Link testID="open-sheet-radius" href="/sheet-radius" style={styles.button}>
        Open Sheet (radius 40)
      </Link>

      <Link testID="open-modal-transparent" href="/modal-transparent" style={styles.button}>
        Open Transparent Modal
      </Link>

      <Link testID="navigate-root" href="/" style={styles.button}>
        Navigate to root
      </Link>

      <Link testID="navigate-modal-margin" href="/modal-margin" style={styles.button}>
        Push to non-modal route
      </Link>
    </ScrollView>
  );
}
