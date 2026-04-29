import { Column, Host, Text } from '@expo/ui/jetpack-compose';
import { background, clip, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { requireNativeModule } from 'expo';
import { MyCustomView, customBorder } from 'test-expo-ui';

let hasTestExpoUiModule = false;
try {
  requireNativeModule('TestExpoUi');
  hasTestExpoUiModule = true;
} catch {
  hasTestExpoUiModule = false;
}

export default function ExtendingExpoUIScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <Column modifiers={[paddingAll(16)]}>
        {hasTestExpoUiModule ? (
          <MyCustomView
            title="Hello from MyCustomView"
            modifiers={[
              background('#e0f0ff'),
              clip({ type: 'roundedCorner', radius: 12 }),
              customBorder({ color: '#FF6B35', width: 3, cornerRadius: 8 }),
              paddingAll(16),
            ]}>
            <Text>This is a child of MyCustomView</Text>
          </MyCustomView>
        ) : (
          <Text>test-expo-ui module is not available in this environment.</Text>
        )}
      </Column>
    </Host>
  );
}
