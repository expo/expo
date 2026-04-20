import { Host, Section, Text, VStack, HStack, Button, Form } from '@expo/ui/swift-ui';
import {
  animation,
  Animation,
  contentTransition,
  font,
  contentShape,
  shapes,
  buttonStyle,
} from '@expo/ui/swift-ui/modifiers';
import { useRef, useState } from 'react';

export default function ContentTransitionScreen() {
  const [count, setCount] = useState(0);
  const countsDown = useRef(false);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section
          title="Numeric Text (Count Up/Down)"
          modifiers={[contentShape(shapes.rectangle())]}>
          <VStack spacing={16}>
            <Text
              modifiers={[
                font({ size: 48, weight: 'bold', design: 'rounded' }),
                contentTransition('numericText', { countsDown: countsDown.current }),
                animation(Animation.default, count),
              ]}>
              {count.toLocaleString()}
            </Text>
            <HStack spacing={16}>
              <Button
                label="Increment"
                modifiers={[buttonStyle('bordered')]}
                onPress={() => {
                  countsDown.current = false;
                  setCount((c) => c + 1);
                }}
              />
              <Button
                modifiers={[buttonStyle('bordered')]}
                label="Decrement"
                onPress={() => {
                  countsDown.current = true;
                  setCount((c) => c - 1);
                }}
              />
            </HStack>
          </VStack>
        </Section>
      </Form>
    </Host>
  );
}
