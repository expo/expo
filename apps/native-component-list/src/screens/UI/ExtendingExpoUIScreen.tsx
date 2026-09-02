import { Host, Text, VStack } from '@expo/ui/swift-ui';
import { padding, cornerRadius, background } from '@expo/ui/swift-ui/modifiers';
import { requireNativeModule } from 'expo';
import { useState } from 'react';
import { MyCustomView, customBorder } from 'test-expo-ui';

let hasTestExpoUiModule = false;
try {
  requireNativeModule('TestExpoUi');
  hasTestExpoUiModule = true;
} catch {
  hasTestExpoUiModule = false;
}

export default function ExtendingExpoUIScreen() {
  const [tapCount, setTapCount] = useState(0);
  return (
    <Host style={{ flex: 1 }}>
      <VStack modifiers={[padding({ all: 16 })]}>
        {hasTestExpoUiModule ? (
          <MyCustomView
            title="Tap me (taps reach JS via onCustomTap)"
            onCustomTap={() => setTapCount((count) => count + 1)}
            modifiers={[
              padding({ all: 16 }),
              background('#e0f0ff'),
              cornerRadius(12),
              customBorder({ color: '#FF6B35', width: 3, cornerRadius: 8 }),
            ]}>
            <Text>Tapped {tapCount} times</Text>
          </MyCustomView>
        ) : (
          <Text>test-expo-ui module is not available in this environment.</Text>
        )}
      </VStack>
    </Host>
  );
}
