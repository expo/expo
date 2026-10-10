import { Button, Column, Host, RNHostView, Text as ComposeText } from '@expo/ui/jetpack-compose';
import { size } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

// Repro for https://github.com/expo/expo/issues/51159 without a navigation header.
// The hosted box is mounted first, so Compose creates its container for hosted views before the
// first ripple. The large Compose button makes the ripple helper view cover the box afterwards.
export default function HostTouchAfterRippleScreen() {
  const [hostKey, setHostKey] = useState(0);
  const [boxPressCount, setBoxPressCount] = useState(0);
  const [buttonPressCount, setButtonPressCount] = useState(0);

  const reset = () => {
    setHostKey((key) => key + 1);
    setBoxPressCount(0);
    setButtonPressCount(0);
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Host matchContents key={hostKey}>
        <Column>
          <RNHostView matchContents>
            <Pressable
              testID="hosted-box"
              style={{
                width: 56,
                height: 56,
                backgroundColor: 'gold',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setBoxPressCount((count) => count + 1)}>
              <Text>RN</Text>
            </Pressable>
          </RNHostView>
          <Button
            modifiers={[size(240, 120)]}
            onClick={() => setButtonPressCount((count) => count + 1)}>
            <ComposeText>Compose button</ComposeText>
          </Button>
        </Column>
      </Host>

      <Text testID="box-press-count">Gold box presses: {boxPressCount}</Text>
      <Text testID="button-press-count">Compose button presses: {buttonPressCount}</Text>

      <Text>1. Tap the gold box. Its count goes up.</Text>
      <Text>2. Tap the Compose button once.</Text>
      <Text>3. Tap the gold box again. With the bug, its count stays the same.</Text>

      <Pressable
        testID="reset"
        onPress={reset}
        style={{ alignSelf: 'flex-start', padding: 12, backgroundColor: '#ddd' }}>
        <Text>Reset (remounts the Host)</Text>
      </Pressable>
    </View>
  );
}
