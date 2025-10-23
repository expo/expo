import { usePreventRemove } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const router = useRouter();
  usePreventRemove(isPrevented, () => {
    Alert.alert('Prevented!', 'You cannot dismiss this modal right now.');
  });
  return (
    <View style={{ flex: 1, padding: 60, backgroundColor: 'rgba(255, 0, 0, 0.3)' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Transparent Modal</Text>
      <Text>
        This is a transparent modal to demonstrate default behaviour. You need to navigate or use
        the back button to dismiss it. You can't dismiss it by tapping outside the modal.
      </Text>
      <Text>
        The modal is transparent, so you can see the background behind it. The background color is
        not part of the modal, it's the background of the page.
      </Text>
      <Pressable
        onPress={() => {
          router.back();
        }}>
        <Text style={styles.button}>Go back</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          router.dismissAll();
        }}>
        <Text style={styles.button}>Dismiss all</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setIsPrevented((p) => !p);
        }}>
        <Text style={styles.button}>{isPrevented ? 'Disable' : 'Enable'} preventRemove</Text>
      </Pressable>
    </View>
  );
}
