import { router, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function HookForm() {
  const [dirty, setDirty] = useState(true);
  const [preventedCount, setPreventedCount] = useState(0);
  const [pendingNavigation, setPendingNavigation] = useState<{ repeat: () => void } | null>(null);

  usePreventRemove(dirty, ({ repeat }) => {
    setPendingNavigation({ repeat });
    setPreventedCount((count) => count + 1);
  });

  return (
    <View>
      <Text testID="form-hook">Hook form</Text>
      <Text testID="dirty">{dirty ? 'dirty' : 'clean'}</Text>
      <Text testID="prevented-count">{preventedCount}</Text>
      <Button testID="back" title="Back" onPress={() => router.back()} />
      <Button
        testID="discard"
        title="Discard"
        disabled={!dirty}
        onPress={() => {
          setDirty(false);
          setPendingNavigation(null);
          pendingNavigation?.repeat();
        }}
      />
    </View>
  );
}
