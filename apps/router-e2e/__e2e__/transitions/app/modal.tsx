import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

// A modal to characterize native dismiss (swipe-down / gesture) against a pending JS push (D5).
export default function Modal() {
  return (
    <View
      testID="modal-content"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}>
      <Text>Modal</Text>
      <Button
        testID="modal-push-slow"
        title="push /slow from modal"
        onPress={() => router.push('/slow')}
      />
      <Button testID="modal-close" title="close" onPress={() => router.back()} />
    </View>
  );
}
