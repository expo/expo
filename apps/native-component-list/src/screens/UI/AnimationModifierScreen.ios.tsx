import { Host, Section, Text, Form, VStack, HStack } from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  shadow,
  padding,
  frame,
  opacity,
  scaleEffect,
  rotationEffect,
  offset,
  onTapGesture,
  animation,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default function AnimationModifierScreen() {
  const [isScaled, setIsScaled] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [isOffset, setIsOffset] = useState(false);
  const [opacityValue, setOpacityValue] = useState(1.0);
  const [animationCounter, setAnimationCounter] = useState(0);

  return (
    <ScrollView style={styles.container}>
      <Host matchContents useViewportSizeMeasurement>
        <Form>
          <Section title="🎯 Scale Animation">
            <VStack spacing={20}>
              <Text>Tap the box to see easeInOut scaling</Text>
              <HStack
                modifiers={[
                  frame({ width: 120, height: 120 }),
                  background('#FF6B6B'),
                  cornerRadius(20),
                  shadow({ radius: 12, x: 0, y: 6, color: '#FF6B6B40' }),
                  scaleEffect(isScaled ? 1.2 : 1.0),
                  animation({ curve: 'easeInOut', animatedValue: isScaled }),
                  onTapGesture(() => setIsScaled(!isScaled)),
                ]}
              />
            </VStack>
          </Section>

          <Section title="🌀 Rotation Animation">
            <VStack spacing={20}>
              <Text>Tap the box to see easeIn rotation</Text>
              <HStack
                modifiers={[
                  frame({ width: 100, height: 100 }),
                  background('#4ECDC4'),
                  cornerRadius(16),
                  shadow({ radius: 10, x: 0, y: 5, color: '#4ECDC440' }),
                  rotationEffect(isRotated ? 180 : 0),
                  animation({ curve: 'easeIn', animatedValue: isRotated }),
                  onTapGesture(() => setIsRotated(!isRotated)),
                ]}
              />
            </VStack>
          </Section>

          <Section title="🚀 Slide Animation">
            <VStack spacing={20}>
              <Text>Tap the box to see easeOut sliding</Text>
              <HStack
                modifiers={[
                  frame({ width: 80, height: 80 }),
                  background('#9B59B6'),
                  cornerRadius(12),
                  shadow({ radius: 8, x: 0, y: 4, color: '#9B59B640' }),
                  offset({ x: isOffset ? 80 : 0, y: 0 }),
                  animation({ curve: 'easeOut', animatedValue: isOffset }),
                  onTapGesture(() => setIsOffset(!isOffset)),
                ]}
              />
            </VStack>
          </Section>

          <Section title="👻 Opacity Animation">
            <VStack spacing={20}>
              <Text>Tap the box to see linear fade</Text>
              <HStack
                modifiers={[
                  frame({ width: 100, height: 100 }),
                  background('#F39C12'),
                  cornerRadius(18),
                  shadow({ radius: 6, x: 0, y: 3, color: '#F39C1240' }),
                  opacity(opacityValue),
                  animation({ curve: 'linear', animatedValue: opacityValue }),
                  onTapGesture(() => setOpacityValue(opacityValue === 1.0 ? 0.2 : 1.0)),
                ]}
              />
            </VStack>
          </Section>

          <Section title="🎪 Combined Animations">
            <VStack spacing={20}>
              <Text>Tap for scale + rotation + opacity</Text>
              <HStack
                modifiers={[
                  frame({ width: 120, height: 120 }),
                  background('#E74C3C'),
                  cornerRadius(24),
                  shadow({ radius: 16, x: 0, y: 8, color: '#E74C3C30' }),
                  scaleEffect(animationCounter % 2 === 0 ? 1.0 : 1.2),
                  rotationEffect(animationCounter * 45),
                  opacity(animationCounter % 4 === 0 ? 1.0 : 0.7),
                  animation({ curve: 'easeInOut', animatedValue: animationCounter }),
                  onTapGesture(() => setAnimationCounter(animationCounter + 1)),
                ]}
              />
              <Text>{`Taps: ${animationCounter.toString()}`}</Text>
            </VStack>
          </Section>

          <Section title="📊 Curve Comparison">
            <VStack spacing={16}>
              <Text>Tap any box to see different curves</Text>

              {[
                { curve: 'easeInOut', label: 'Ease In Out', color: '#3498DB' },
                { curve: 'easeIn', label: 'Ease In', color: '#E67E22' },
                { curve: 'easeOut', label: 'Ease Out', color: '#2ECC71' },
                { curve: 'linear', label: 'Linear', color: '#9B59B6' },
              ].map(({ curve, label, color }) => (
                <HStack key={curve} spacing={20}>
                  <Text
                    modifiers={[
                      frame({ minWidth: 100 }),
                      padding({ horizontal: 12, vertical: 8 }),
                    ]}>
                    {label}
                  </Text>
                  <HStack
                    modifiers={[
                      frame({ width: 60, height: 60 }),
                      background(color),
                      cornerRadius(12),
                      shadow({ radius: 6, x: 0, y: 3, color: `${color}40` }),
                      scaleEffect(isScaled ? 1.4 : 1.0),
                      animation({ curve: curve as any, animatedValue: isScaled }),
                      onTapGesture(() => setIsScaled(!isScaled)),
                    ]}
                  />
                </HStack>
              ))}
            </VStack>
          </Section>

          <Section title="🎮 Controls">
            <VStack spacing={16}>
              <HStack
                modifiers={[
                  frame({ width: 200, height: 50 }),
                  background('#34495E'),
                  cornerRadius(12),
                  shadow({ radius: 4, x: 0, y: 2, color: '#34495E40' }),
                  onTapGesture(() => {
                    setAnimationCounter(0);
                    setIsRotated(false);
                    setIsScaled(false);
                    setIsOffset(false);
                    setOpacityValue(1.0);
                  }),
                ]}
              />
            </VStack>
          </Section>
        </Form>
      </Host>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});

AnimationModifierScreen.navigationOptions = {
  title: 'Animation Modifier',
};
