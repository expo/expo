import { Host, Section, Text, Form, VStack, HStack } from '@expo/ui/swift-ui';
import {
  animation,
  Animation,
  contentTransition,
  frame,
  background,
  cornerRadius,
  onTapGesture,
  padding,
  font,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function ContentTransitionScreen() {
  const [count, setCount] = useState(0);
  const [countDown, setCountDown] = useState(100);
  const [opacityCount, setOpacityCount] = useState(0);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Numeric Text (Count Up)">
          <VStack spacing={16}>
            <Text>Tap to increment</Text>
            <Text
              modifiers={[
                font({ size: 48, weight: 'bold', design: 'rounded' }),
                contentTransition('numericText'),
                animation(Animation.default, count),
              ]}>
              {count.toLocaleString()}
            </Text>
            <HStack
              modifiers={[
                frame({ width: 200, height: 44 }),
                background('#007AFF'),
                cornerRadius(12),
                onTapGesture(() => setCount((c) => c + 1)),
              ]}>
              <Text modifiers={[padding()]}>Increment</Text>
            </HStack>
          </VStack>
        </Section>

        <Section title="Numeric Text (Count Down)">
          <VStack spacing={16}>
            <Text>Tap to decrement with countsDown animation</Text>
            <Text
              modifiers={[
                font({ size: 48, weight: 'bold', design: 'rounded' }),
                contentTransition('numericText', { countsDown: true }),
                animation(Animation.default, countDown),
              ]}>
              {countDown.toLocaleString()}
            </Text>
            <HStack
              modifiers={[
                frame({ width: 200, height: 44 }),
                background('#FF3B30'),
                cornerRadius(12),
                onTapGesture(() => setCountDown((c) => c - 1)),
              ]}>
              <Text modifiers={[padding()]}>Decrement</Text>
            </HStack>
          </VStack>
        </Section>

        <Section title="Opacity Transition">
          <VStack spacing={16}>
            <Text>Content fades in/out on change</Text>
            <Text
              modifiers={[
                font({ size: 48, weight: 'bold', design: 'rounded' }),
                contentTransition('opacity'),
                animation(Animation.easeInOut({ duration: 0.5 }), opacityCount),
              ]}>
              {opacityCount.toLocaleString()}
            </Text>
            <HStack
              modifiers={[
                frame({ width: 200, height: 44 }),
                background('#34C759'),
                cornerRadius(12),
                onTapGesture(() => setOpacityCount((c) => c + 1)),
              ]}>
              <Text modifiers={[padding()]}>Increment</Text>
            </HStack>
          </VStack>
        </Section>
      </Form>
    </Host>
  );
}
