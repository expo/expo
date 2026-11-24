import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FeedbackButton() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const from = `/${segments.join('/')}`;
  // 72 adds room for the iOS floating tab bar to the 16-point margin.
  const bottom = insets.bottom + (process.env.EXPO_OS === 'ios' ? 72 : 16);

  return (
    <Pressable
      style={[styles.button, { bottom }]}
      onPress={() => router.push({ pathname: '/examples/feedback/form', params: { from } })}>
      <Text style={styles.label}>Feedback</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  label: { color: '#fff', fontWeight: '600' },
});
