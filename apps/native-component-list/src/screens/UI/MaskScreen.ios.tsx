import {
  Circle,
  Host,
  HStack,
  Image,
  Mask,
  Rectangle,
  RoundedRectangle,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import { bold, font, foregroundStyle, frame } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';

export default function MaskScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Text mask with colored stripes">
        <Host matchContents>
          <Mask>
            <HStack modifiers={[frame({ width: 320, height: 80 })]}>
              <Rectangle modifiers={[foregroundStyle('#3D5A80')]} />
              <Rectangle modifiers={[foregroundStyle('#DAA520')]} />
              <Rectangle modifiers={[foregroundStyle('#E07A5F')]} />
              <Rectangle modifiers={[foregroundStyle('#D5D5D5')]} />
            </HStack>
            <Mask.Content>
              <Text modifiers={[font({ size: 60, weight: 'bold' })]}>Basic Mask</Text>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Gradient text">
        <Host matchContents>
          <Mask>
            <Rectangle
              modifiers={[
                foregroundStyle({
                  type: 'linearGradient',
                  colors: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
                frame({ width: 300, height: 80 }),
              ]}
            />
            <Mask.Content>
              <Text modifiers={[font({ size: 72, weight: 'heavy' })]}>EXPO</Text>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Shape mask (circle)">
        <Host matchContents>
          <Mask>
            <Image
              systemName="photo.fill"
              size={160}
              modifiers={[foregroundStyle('#007AFF'), frame({ width: 200, height: 200 })]}
            />
            <Mask.Content>
              <Circle modifiers={[frame({ width: 140, height: 140 })]} />
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Rounded rectangle mask">
        <Host matchContents>
          <Mask>
            <Rectangle
              modifiers={[
                foregroundStyle({
                  type: 'linearGradient',
                  colors: ['#FF2D55', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
                frame({ width: 260, height: 120 }),
              ]}
            />
            <Mask.Content>
              <RoundedRectangle
                cornerRadius={24}
                modifiers={[frame({ width: 240, height: 100 })]}
              />
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="alignment='topLeading'">
        <Host matchContents>
          <Mask alignment="topLeading">
            <Rectangle
              modifiers={[
                foregroundStyle({
                  type: 'linearGradient',
                  colors: ['#34C759', '#007AFF'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
                frame({ width: 260, height: 120 }),
              ]}
            />
            <Mask.Content>
              <Text modifiers={[bold(), font({ size: 28 })]}>TOP LEADING</Text>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Stacked mask content">
        <Host matchContents>
          <Mask>
            <Rectangle
              modifiers={[
                foregroundStyle({
                  type: 'linearGradient',
                  colors: ['#FF9500', '#FF3B30'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
                frame({ width: 280, height: 140 }),
              ]}
            />
            <Mask.Content>
              <VStack spacing={4}>
                <Text modifiers={[font({ size: 40, weight: 'black' })]}>HELLO</Text>
                <Text modifiers={[font({ size: 40, weight: 'black' })]}>WORLD</Text>
              </VStack>
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Gradient alpha fade (horizontal)">
        <Host matchContents>
          <Mask>
            <HStack modifiers={[frame({ width: 300, height: 80 })]}>
              <Rectangle modifiers={[foregroundStyle('#3D5A80')]} />
              <Rectangle modifiers={[foregroundStyle('#DAA520')]} />
              <Rectangle modifiers={[foregroundStyle('#E07A5F')]} />
              <Rectangle modifiers={[foregroundStyle('#34C759')]} />
              <Rectangle modifiers={[foregroundStyle('#007AFF')]} />
            </HStack>
            <Mask.Content>
              <Rectangle
                modifiers={[
                  foregroundStyle({
                    type: 'linearGradient',
                    colors: ['#000000', '#00000000'],
                    startPoint: { x: 0, y: 0.5 },
                    endPoint: { x: 1, y: 0.5 },
                  }),
                  frame({ width: 300, height: 80 }),
                ]}
              />
            </Mask.Content>
          </Mask>
        </Host>
      </Section>

      <Section title="Gradient alpha fade (vertical)">
        <Host matchContents>
          <Mask>
            <Rectangle
              modifiers={[
                foregroundStyle({
                  type: 'linearGradient',
                  colors: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'],
                  startPoint: { x: 0, y: 0 },
                  endPoint: { x: 1, y: 1 },
                }),
                frame({ width: 200, height: 200 }),
              ]}
            />
            <Mask.Content>
              <Rectangle
                modifiers={[
                  foregroundStyle({
                    type: 'linearGradient',
                    colors: ['#000000', '#000000', '#00000000'],
                    startPoint: { x: 0.5, y: 0 },
                    endPoint: { x: 0.5, y: 1 },
                  }),
                  frame({ width: 200, height: 200 }),
                ]}
              />
            </Mask.Content>
          </Mask>
        </Host>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <RNText style={styles.sectionTitle}>{title}</RNText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
    alignItems: 'center',
  },
  section: {
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636366',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderStyle: 'dashed',
    padding: 4,
  },
});

MaskScreen.navigationOptions = {
  title: 'Mask',
};
