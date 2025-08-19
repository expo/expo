import { Host, Section, Text, Form, VStack, HStack } from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  shadow,
  frame,
  opacity,
  scaleEffect,
  rotationEffect,
  offset,
  onTapGesture,
  animation,
  Animation,
  withDelay,
  withRepeat,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default function AnimationModifierScreen() {
  const [isScaled, setIsScaled] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [animationCounter, setAnimationCounter] = useState(0);
  const [springValue, setSpringValue] = useState(false);
  const [interpolatingSpringValue, setInterpolatingSpringValue] = useState(false);
  const [delayValue, setDelayValue] = useState(false);
  const [repeatValue, setRepeatValue] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Host matchContents useViewportSizeMeasurement>
        <Form>
          <Section title="🎯 Basic Timing Curves">
            <VStack spacing={16}>
              <Text>Tap boxes to see different timing curves</Text>

              <HStack spacing={16}>
                <VStack spacing={8}>
                  <Text>EaseInOut (2s)</Text>
                  <HStack
                    modifiers={[
                      frame({ width: 80, height: 80 }),
                      background('#FF6B6B'),
                      cornerRadius(16),
                      shadow({ radius: 8, x: 0, y: 4, color: '#FF6B6B40' }),
                      scaleEffect(isScaled ? 1.3 : 1.0),
                      animation(Animation.easeInOut(2.0), isScaled),
                      onTapGesture(() => setIsScaled(!isScaled)),
                    ]}>
                    {isScaled ? 'Scaled' : null}
                  </HStack>
                </VStack>

                <VStack spacing={8}>
                  <Text>Linear (0.5s)</Text>
                  <HStack
                    modifiers={[
                      frame({ width: 80, height: 80 }),
                      background('#4ECDC4'),
                      cornerRadius(16),
                      shadow({ radius: 8, x: 0, y: 4, color: '#4ECDC440' }),
                      rotationEffect(isRotated ? 180 : 0),
                      animation(Animation.linear(0.5), isRotated),
                      onTapGesture(() => setIsRotated(!isRotated)),
                    ]}
                  />
                </VStack>
              </HStack>
            </VStack>
          </Section>

          <Section title="🌸 Spring Animations">
            <VStack spacing={16}>
              <Text>Experience the bouncy spring physics</Text>

              <HStack spacing={16}>
                <VStack spacing={8}>
                  <Text>Default Spring</Text>
                  <HStack
                    modifiers={[
                      frame({ width: 90, height: 90 }),
                      background('#9B59B6'),
                      cornerRadius(20),
                      shadow({ radius: 10, x: 0, y: 6, color: '#9B59B640' }),
                      scaleEffect(springValue ? 1.4 : 1.0),
                      animation(Animation.spring(), springValue),
                      onTapGesture(() => setSpringValue(!springValue)),
                    ]}
                  />
                </VStack>

                <VStack spacing={8}>
                  <Text>Custom Spring</Text>
                  <HStack
                    modifiers={[
                      frame({ width: 90, height: 90 }),
                      background('#F39C12'),
                      cornerRadius(20),
                      shadow({ radius: 10, x: 0, y: 6, color: '#F39C1240' }),
                      offset({ x: springValue ? 60 : 0, y: 0 }),
                      animation(Animation.spring(0.8, 0.6), springValue),
                      onTapGesture(() => setSpringValue(!springValue)),
                    ]}
                  />
                </VStack>
              </HStack>
            </VStack>
          </Section>

          <Section title="⚡ Interpolating Spring">
            <VStack spacing={16}>
              <Text>Physics-based spring with mass, stiffness & damping</Text>

              <HStack spacing={16}>
                <VStack spacing={8}>
                  <Text>Bouncy</Text>
                  <HStack
                    modifiers={[
                      frame({ width: 80, height: 80 }),
                      background('#E74C3C'),
                      cornerRadius(12),
                      shadow({ radius: 8, x: 0, y: 4, color: '#E74C3C40' }),
                      scaleEffect(interpolatingSpringValue ? 1.5 : 1.0),
                      animation(
                        Animation.interpolatingSpring(0.5, 200, 5),
                        interpolatingSpringValue
                      ),
                      onTapGesture(() => setInterpolatingSpringValue(!interpolatingSpringValue)),
                    ]}
                  />
                </VStack>

                <VStack spacing={8}>
                  <Text>Smooth</Text>
                  <HStack
                    modifiers={[
                      frame({ width: 80, height: 80 }),
                      background('#2ECC71'),
                      cornerRadius(12),
                      shadow({ radius: 8, x: 0, y: 4, color: '#2ECC7140' }),
                      rotationEffect(interpolatingSpringValue ? 360 : 0),
                      animation(
                        Animation.interpolatingSpring(1.0, 100, 20),
                        interpolatingSpringValue
                      ),
                      onTapGesture(() => setInterpolatingSpringValue(!interpolatingSpringValue)),
                    ]}
                  />
                </VStack>
              </HStack>
            </VStack>
          </Section>

          <Section title="⏰ Delay & Repeat">
            <VStack spacing={16}>
              <Text>Advanced animation timing controls</Text>

              <HStack spacing={16}>
                <VStack spacing={8}>
                  <Text>1s Delay</Text>
                  <HStack
                    modifiers={[
                      frame({ width: 80, height: 80 }),
                      background('#3498DB'),
                      cornerRadius(16),
                      shadow({ radius: 8, x: 0, y: 4, color: '#3498DB40' }),
                      scaleEffect(delayValue ? 1.3 : 1.0),
                      animation(withDelay(Animation.easeInOut(0.8), 1.0), delayValue),
                      onTapGesture(() => setDelayValue(!delayValue)),
                    ]}
                  />
                </VStack>

                <VStack spacing={8}>
                  <Text>Repeat 3x</Text>
                  <HStack
                    modifiers={[
                      frame({ width: 80, height: 80 }),
                      background('#E67E22'),
                      cornerRadius(16),
                      shadow({ radius: 8, x: 0, y: 4, color: '#E67E2240' }),
                      rotationEffect(repeatValue ? 180 : 0),
                      animation(withRepeat(Animation.easeInOut(0.6), 3, true), repeatValue),
                      onTapGesture(() => setRepeatValue(!repeatValue)),
                    ]}
                  />
                </VStack>
              </HStack>
            </VStack>
          </Section>

          <Section title="🎪 Complex Combinations">
            <VStack spacing={16}>
              <Text>Multiple effects with different animations</Text>

              <HStack
                modifiers={[
                  frame({ width: 120, height: 120 }),
                  background('#8E44AD'),
                  cornerRadius(24),
                  shadow({ radius: 16, x: 0, y: 8, color: '#8E44AD30' }),
                  scaleEffect(animationCounter % 2 === 0 ? 1.0 : 1.2),
                  rotationEffect(animationCounter * 45),
                  opacity(animationCounter % 4 === 0 ? 1.0 : 0.7),
                  animation(Animation.spring(0.7, 0.8), animationCounter),
                  onTapGesture(() => setAnimationCounter(animationCounter + 1)),
                ]}
              />
              <Text>{`Spring-powered multi-animation • Taps: ${animationCounter}`}</Text>
            </VStack>
          </Section>

          <Section title="🎮 Reset Controls">
            <VStack spacing={16}>
              <HStack
                modifiers={[
                  frame({ width: 250, height: 50 }),
                  background('#34495E'),
                  cornerRadius(16),
                  shadow({ radius: 6, x: 0, y: 3, color: '#34495E40' }),
                  onTapGesture(() => {
                    setAnimationCounter(0);
                    setIsRotated(false);
                    setIsScaled(false);
                    setSpringValue(false);
                    setInterpolatingSpringValue(false);
                    setDelayValue(false);
                    setRepeatValue(false);
                  }),
                ]}
              />
              <Text>Reset All Animations</Text>
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
