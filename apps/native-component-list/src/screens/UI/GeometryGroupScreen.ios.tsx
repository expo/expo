import { Button, Host, Rectangle, Text, Toggle, VStack } from '@expo/ui/swift-ui';
import {
  Animation,
  animation,
  buttonStyle,
  controlSize,
  cornerRadius,
  foregroundStyle,
  frame,
  geometryGroup,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { View } from 'react-native';

export default function GeometryGroupScreen() {
  const [busy, setBusy] = useState(false);
  const [isGeometryGroupEnabled, setIsGeometryGroupEnabled] = useState(true);

  return (
    <View style={{ flex: 1 }}>
      <Host style={{ flex: 1 }}>
        <VStack spacing={16} modifiers={[padding({ all: 20 })]}>
          <Toggle
            isOn={isGeometryGroupEnabled}
            onIsOnChange={setIsGeometryGroupEnabled}
            label="geometryGroup"
          />
          <Text>
            Tap the button to insert and remove the banner. With geometryGroup off, the button label
            leaves the button while the spring runs.
          </Text>

          <VStack
            spacing={12}
            modifiers={[animation(Animation.spring({ duration: 1.6, bounce: 0.3 }), busy)]}>
            {busy ? (
              <Rectangle
                modifiers={[
                  frame({ maxWidth: Infinity, height: 150 }),
                  foregroundStyle('#FFD60A'),
                  cornerRadius(18),
                ]}
              />
            ) : null}

            <Button
              label={busy ? 'Check Now…' : 'Check Now'}
              systemImage={busy ? 'hourglass' : 'arrow.clockwise'}
              onPress={() => setBusy(!busy)}
              modifiers={[
                buttonStyle('borderedProminent'),
                controlSize('large'),
                frame({ maxWidth: Infinity }),
                ...(isGeometryGroupEnabled ? [geometryGroup()] : []),
              ]}
            />
          </VStack>
        </VStack>
      </Host>
    </View>
  );
}
