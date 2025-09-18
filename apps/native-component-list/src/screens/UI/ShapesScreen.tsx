import React from 'react';

import {
  Rectangle,
  RoundedRectangle,
  Ellipse,
  UnevenRoundedRectangle,
  Capsule,
  Circle,
  VStack,
  HStack,
  Host,
  Section,
  Form,
  Text,
} from '@expo/ui/swift-ui';
import { frame, border, shadow, fill } from '@expo/ui/swift-ui/modifiers';

export default function ShapesScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Rectangle">
          <VStack spacing={16}>
            <Text>Rectangle shape</Text>
            <Rectangle modifiers={[frame({ width: 200, height: 100 }), fill('#007AFF')]} />
          </VStack>
        </Section>

        <Section title="RoundedRectangle">
          <VStack spacing={16}>
            <Text>Rectangle with corner radius</Text>
            <RoundedRectangle
              cornerRadius={20}
              modifiers={[frame({ width: 200, height: 100 }), fill('#FF9500')]}
            />
            <RoundedRectangle
              cornerRadius={10}
              modifiers={[
                frame({ width: 150, height: 75 }),
                fill('#FF2D92'),
                shadow({ color: '#000000', radius: 5, x: 0, y: 2 }),
              ]}
            />
          </VStack>
        </Section>

        <Section title="Circle">
          <VStack spacing={16}>
            <Text>Circle shape</Text>
            <HStack spacing={16}>
              <Circle modifiers={[frame({ width: 80, height: 80 }), fill('#5856D6')]} />
              <Circle
                modifiers={[
                  frame({ width: 100, height: 100 }),
                  fill('#FF3B30'),
                  shadow({ color: '#FF3B30', radius: 10, x: 0, y: 0 }),
                ]}
              />
            </HStack>
          </VStack>
        </Section>

        <Section title="Ellipse">
          <VStack spacing={16}>
            <Text>Ellipse shape</Text>
            <Ellipse modifiers={[frame({ width: 200, height: 100 }), fill('#30D158')]} />
          </VStack>
        </Section>

        <Section title="Capsule">
          <VStack spacing={16}>
            <Text>Pill/capsule shape</Text>
            <VStack spacing={12}>
              <HStack spacing={16}>
                <VStack spacing={8}>
                  <Text>Continuous</Text>
                  <Capsule
                    cornerStyle="continuous"
                    modifiers={[frame({ width: 120, height: 40 }), fill('#5AC8FA')]}
                  />
                </VStack>
                <VStack spacing={8}>
                  <Text>Circular</Text>
                  <Capsule
                    cornerStyle="circular"
                    modifiers={[frame({ width: 120, height: 40 }), fill('#FF9F0A')]}
                  />
                </VStack>
              </HStack>
            </VStack>
          </VStack>
        </Section>

        <Section title="UnevenRoundedRectangle">
          <VStack spacing={16}>
            <Text>Rectangle with different corner radii (iOS 16+)</Text>
            <UnevenRoundedRectangle
              topLeadingRadius={20}
              topTrailingRadius={5}
              bottomLeadingRadius={5}
              bottomTrailingRadius={20}
              modifiers={[frame({ width: 200, height: 100 }), fill('#BF5AF2')]}
            />
          </VStack>
        </Section>
      </Form>
    </Host>
  );
}

ShapesScreen.navigationOptions = {
  title: 'Shapes',
};
