import { usePreventRemove } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const [isPrevented, setIsPrevented] = useState(false);
  usePreventRemove(isPrevented, () => {
    Alert.alert('Prevented!', 'You cannot dismiss this modal right now.');
  });
  return (
    <ScrollView style={{ padding: 16 }}>
      <Text
        testID="modal-title-full"
        style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Default page in nested layout
      </Text>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Text>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </Text>
      <View style={{ marginTop: 20 }}>
        <Link testID="open-modal-regular" href="/nested/sheet-radius" style={styles.button}>
          Sheet
        </Link>
        <Link testID="open-modal-regular" href="/modal-transparent" style={styles.button}>
          Modal (transparent)
        </Link>
      </View>
      <Pressable
        onPress={() => {
          setIsPrevented((p) => !p);
        }}>
        <Text style={styles.button}>{isPrevented ? 'Disable' : 'Enable'} preventRemove</Text>
      </Pressable>
    </ScrollView>
  );
}
