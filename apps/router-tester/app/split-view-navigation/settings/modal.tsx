import { router } from 'expo-router';
import { Button, View } from 'react-native';

export default function Modal() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="router.back()" onPress={() => router.back()} />
    </View>
  );
}
