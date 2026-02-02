import { Host, Text, VStack } from '@expo/ui/swift-ui';
import { padding, cornerRadius, background } from '@expo/ui/swift-ui/modifiers';
import { MyCustomView, customBorder } from 'test-expo-ui';
import { requireNativeModule } from 'expo';

let hasNativeMyCustomView = false;
try {
  requireNativeModule('TestExpoUi');
  hasNativeMyCustomView = true;
} catch {
  hasNativeMyCustomView = false;
}

export default function ExtendingExpoUIScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <VStack modifiers={[padding({ all: 16 })]}>
        {hasNativeMyCustomView ? (
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
        ) : (
          <Text>test-expo-ui module is not available in this environment.</Text>
        )}
      </VStack>
    </Host>
  );
}
