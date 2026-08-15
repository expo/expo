import { Host, VStack, Text } from '@expo/ui/swift-ui';
import {
  frame,
  padding,
  background,
  cornerRadius,
  rotation3DEffect,
  animation,
  Animation,
  onTapGesture,
  font,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function Rotation3DEffectScreen() {
  const [flipped, setFlipped] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <VStack
        alignment="center"
        modifiers={[
          frame({ maxWidth: 10000, height: 200 }),
          padding({ all: 24 }),
          background('#007AFF'),
          cornerRadius(20),
          rotation3DEffect({ angle: flipped ? 180 : 0, axis: { y: 1 } }),
          animation(Animation.spring({ duration: 0.6 }), flipped),
          onTapGesture(() => setFlipped((p) => !p)),
        ]}>
        <Text modifiers={[font({ size: 32, weight: 'bold' })]}>Tap to flip</Text>
      </VStack>
    </Host>
  );
}

Rotation3DEffectScreen.navigationOptions = {
  title: 'rotation3DEffect modifier',
};
