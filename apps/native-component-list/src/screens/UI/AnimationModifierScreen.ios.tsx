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
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function AnimationModifierScreen() {
  const [animationState1, setAnimationState1] = useState(false);
  const [animationState2, setAnimationState2] = useState(false);
  const [animationState3, setAnimationState3] = useState(0);
  const [animationState4, setAnimationState4] = useState(false);
  const [animationState5, setAnimationState5] = useState(false);
  const [animationState6, setAnimationState6] = useState(false);
  const [animationState7, setAnimationState7] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="🎯 Basic Timing Curves">
          <VStack spacing={16}>
            <Text>Tap boxes to see different timing curves</Text>

            <HStack spacing={16}>
              <VStack spacing={8}>
                <Text>EaseInOut (2s)</Text>
                {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
                <HStack
                  modifiers={[
                    frame({ width: 80, height: 80 }),
                    background('#FF6B6B'),
                    cornerRadius(16),
                    shadow({ radius: 8, x: 0, y: 4, color: '#FF6B6B40' }),
                    scaleEffect(animationState1 ? 1.3 : 1.0),
                    animation(Animation.easeInOut({ duration: 2.0 }), animationState1),
                    onTapGesture(() => setAnimationState1(!animationState1)),
                  ]}
                />
              </VStack>

              <VStack spacing={8}>
                <Text>Linear (0.5s)</Text>
                {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
                <HStack
                  modifiers={[
                    frame({ width: 80, height: 80 }),
                    background('#4ECDC4'),
                    cornerRadius(16),
                    shadow({ radius: 8, x: 0, y: 4, color: '#4ECDC440' }),
                    rotationEffect(animationState2 ? 180 : 0),
                    animation(Animation.linear({ duration: 0.5 }), animationState2),
                    onTapGesture(() => setAnimationState2(!animationState2)),
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
                {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
                <HStack
                  modifiers={[
                    frame({ width: 90, height: 90 }),
                    background('#9B59B6'),
                    cornerRadius(20),
                    shadow({ radius: 10, x: 0, y: 6, color: '#9B59B640' }),
                    scaleEffect(animationState4 ? 1.4 : 1.0),
                    animation(Animation.spring(), animationState4),
                    onTapGesture(() => setAnimationState4(!animationState4)),
                  ]}
                />
              </VStack>

              <VStack spacing={8}>
                <Text>Custom Spring</Text>
                {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
                <HStack
                  modifiers={[
                    frame({ width: 90, height: 90 }),
                    background('#F39C12'),
                    cornerRadius(20),
                    shadow({ radius: 10, x: 0, y: 6, color: '#F39C1240' }),
                    offset({ x: animationState4 ? 60 : 0, y: 0 }),
                    animation(
                      Animation.spring({ response: 0.8, dampingFraction: 0.6 }),
                      animationState4
                    ),
                    onTapGesture(() => setAnimationState4(!animationState4)),
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
                {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
                <HStack
                  modifiers={[
                    frame({ width: 80, height: 80 }),
                    background('#E74C3C'),
                    cornerRadius(12),
                    shadow({ radius: 8, x: 0, y: 4, color: '#E74C3C40' }),
                    scaleEffect(animationState5 ? 1.5 : 1.0),
                    animation(
                      Animation.interpolatingSpring({
                        mass: 0.5,
                        stiffness: 200,
                        damping: 5,
                      }),
                      animationState5
                    ),
                    onTapGesture(() => setAnimationState5(!animationState5)),
                  ]}
                />
              </VStack>

              <VStack spacing={8}>
                <Text>Smooth</Text>
                {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
                <HStack
                  modifiers={[
                    frame({ width: 80, height: 80 }),
                    background('#2ECC71'),
                    cornerRadius(12),
                    shadow({ radius: 8, x: 0, y: 4, color: '#2ECC7140' }),
                    rotationEffect(animationState5 ? 360 : 0),
                    animation(
                      Animation.interpolatingSpring({
                        mass: 1.0,
                        stiffness: 100,
                        damping: 20,
                      }),
                      animationState5
                    ),
                    onTapGesture(() => setAnimationState5(!animationState5)),
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
                {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
                <HStack
                  modifiers={[
                    frame({ width: 80, height: 80 }),
                    background('#3498DB'),
                    cornerRadius(16),
                    shadow({ radius: 8, x: 0, y: 4, color: '#3498DB40' }),
                    scaleEffect(animationState6 ? 1.3 : 1.0),
                    animation(Animation.easeInOut({ duration: 0.8 }).delay(1.0), animationState6),
                    onTapGesture(() => setAnimationState6(!animationState6)),
                  ]}
                />
              </VStack>

              <VStack spacing={8}>
                <Text>Repeat 3x</Text>
                {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
                <HStack
                  modifiers={[
                    frame({ width: 80, height: 80 }),
                    background('#E67E22'),
                    cornerRadius(16),
                    shadow({ radius: 8, x: 0, y: 4, color: '#E67E2240' }),
                    rotationEffect(animationState7 ? 180 : 0),
                    animation(
                      Animation.easeInOut({ duration: 0.6 }).repeat({
                        repeatCount: 3,
                        autoreverses: true,
                      }),
                      animationState7
                    ),
                    onTapGesture(() => setAnimationState7(!animationState7)),
                  ]}
                />
              </VStack>
            </HStack>
          </VStack>
        </Section>

        <Section title="🎪 Complex Combinations">
          <VStack spacing={16}>
            <Text>Multiple effects with different animations</Text>

            {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
            <HStack
              modifiers={[
                frame({ width: 120, height: 120 }),
                background('#8E44AD'),
                cornerRadius(24),
                shadow({ radius: 16, x: 0, y: 8, color: '#8E44AD30' }),
                scaleEffect(animationState3 % 2 === 0 ? 1.0 : 1.2),
                rotationEffect(animationState3 * 45),
                opacity(animationState3 % 4 === 0 ? 1.0 : 0.7),
                animation(
                  Animation.spring({ response: 0.7, dampingFraction: 0.8 }),
                  animationState3
                ),
                onTapGesture(() => setAnimationState3(animationState3 + 1)),
              ]}
            />
            <Text>{`Spring-powered multi-animation • Taps: ${animationState3}`}</Text>
          </VStack>
        </Section>

        <Section title="🎮 Reset Controls">
          <VStack spacing={16}>
            {/* @ts-expect-error - we need a rectangle box here. remove once we have a rectangle component */}
            <HStack
              modifiers={[
                frame({ width: 250, height: 50 }),
                background('#34495E'),
                cornerRadius(16),
                shadow({ radius: 6, x: 0, y: 3, color: '#34495E40' }),
                onTapGesture(() => {
                  setAnimationState3(0);
                  setAnimationState2(false);
                  setAnimationState1(false);
                  setAnimationState4(false);
                  setAnimationState5(false);
                  setAnimationState6(false);
                  setAnimationState7(false);
                }),
              ]}
            />
            <Text>Reset All Animations</Text>
          </VStack>
        </Section>
      </Form>
    </Host>
  );
}
