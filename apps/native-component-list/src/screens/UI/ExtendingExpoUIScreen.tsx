import { Host, Text, VStack } from '@expo/ui/swift-ui';
import { padding, cornerRadius, background } from '@expo/ui/swift-ui/modifiers';

import { MyCustomView, customBorder } from '../../../modules/test-expo-ui';

export default function ExtendingExpoUIScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <VStack modifiers={[padding({ all: 16 })]}>
        <Text>Custom Component with modifiers:</Text>
        <MyCustomView
          title="Hello from MyCustomView"
          modifiers={[
            padding({ all: 16 }),
            background('#e0f0ff'),
            cornerRadius(12),
            customBorder({ color: '#FF6B35', width: 3, cornerRadius: 8 }),
          ]}>
          <Text>This is a child of MyCustomView</Text>
        </MyCustomView>
      </VStack>
    </Host>
  );
}
