import { Form, Host, Overlay, Section, Text, HStack, VStack, Image } from '@expo/ui/swift-ui';
import {
  foregroundStyle,
  frame,
  clipShape,
  padding,
  background,
  cornerRadius,
  font,
  bold,
  offset,
} from '@expo/ui/swift-ui/modifiers';
import React from 'react';

export default function OverlayScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="NEW Tag">
          <Overlay alignment="topLeading">
            <HStack
              modifiers={[
                frame({ maxWidth: Infinity }),
                padding({ all: 16 }),
                background('#F2F2F7'),
                cornerRadius(12),
              ]}>
              <Image
                systemName="sparkles"
                modifiers={[foregroundStyle('#FF9500'), frame({ width: 24, height: 24 })]}
              />
              <VStack>
                <Text modifiers={[bold()]}>Expo UI Components</Text>
                <Text modifiers={[font({ size: 13 }), foregroundStyle('#8E8E93')]}>
                  Build native UIs with SwiftUI
                </Text>
              </VStack>
            </HStack>
            <Overlay.Content>
              <Text
                modifiers={[
                  font({ size: 10, weight: 'bold' }),
                  foregroundStyle('#FFFFFF'),
                  padding({ leading: 6, trailing: 6, top: 3, bottom: 3 }),
                  background('#FF9500'),
                  clipShape('capsule'),
                  offset({ x: -6, y: -6 }),
                ]}>
                NEW
              </Text>
            </Overlay.Content>
          </Overlay>
        </Section>
      </Form>
    </Host>
  );
}

OverlayScreen.navigationOptions = {
  title: 'Overlay',
};
