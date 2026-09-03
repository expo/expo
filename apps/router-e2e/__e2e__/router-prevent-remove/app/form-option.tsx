import { router } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function RouterBackForm() {
  const [dirty, setDirty] = useState(true);
  const [preventedCount, setPreventedCount] = useState(0);

  usePreventRemove(dirty, () => setPreventedCount((count) => count + 1));

  return (
    <View>
      <Text testID="form-option">Router back form</Text>
      <Text testID="prevented-count">{preventedCount}</Text>
      <Button testID="back" title="Back" onPress={() => router.back()} />
      <Button
        testID="discard"
        title="Discard"
        onPress={() => {
          setDirty(false);
          router.back();
        }}
      />
    </View>
  );
}
