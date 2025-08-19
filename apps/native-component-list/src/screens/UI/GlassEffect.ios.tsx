import {
  Host,
  HStack,
  NamespaceProvider,
  GlassEffectContainer,
  Image,
  VStack,
  Section,
  Text,
} from '@expo/ui/swift-ui';
import {
  padding,
  offset,
  glassEffect,
  background,
  animation,
  Animation,
  frame,
  glassEffectId,
  zIndex,
  cornerRadius,
  shadow,
  onTapGesture,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { View } from 'react-native';

export default function GlassEffect() {
  const [isGlassExpanded, setIsGlassExpanded] = useState(false);
  return (
    <View
      style={{
        flex: 1,
        experimental_backgroundImage:
          'linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5))',
      }}>
      <Host matchContents useViewportSizeMeasurement>
        <VStack>
          <Section title="✨ Glass Effect Animation">
            <VStack spacing={16}>
              <Text>Animated glass effects with NamespaceProvider</Text>

              <NamespaceProvider>
                <VStack spacing={12}>
                  <GlassEffectContainer spacing={40}>
                    <HStack
                      spacing={40}
                      modifiers={[
                        animation(Animation.spring(), isGlassExpanded),
                        frame({ width: 300, height: 200 }),
                      ]}>
                      <Image
                        systemName="scribble.variable"
                        modifiers={[
                          frame({ width: 80, height: 80 }),
                          glassEffect({
                            glass: {
                              variant: 'clear',
                              interactive: true,
                            },
                          }),
                          glassEffectId('image1', 'glassDemo'),
                        ]}
                      />
                      <Image
                        systemName="eraser.fill"
                        modifiers={[
                          zIndex(-1),
                          frame({ width: 80, height: 80 }),
                          glassEffect({
                            glass: {
                              variant: 'clear',
                              interactive: true,
                            },
                          }),
                          glassEffectId('image2', 'glassDemo'),
                          offset({ x: -40, y: 0 }),
                        ]}
                      />
                    </HStack>
                  </GlassEffectContainer>

                  <HStack
                    modifiers={[
                      frame({ width: 200, height: 50 }),
                      background('#34495E'),
                      cornerRadius(16),
                      shadow({ radius: 6, x: 0, y: 3, color: '#34495E40' }),
                      onTapGesture(() => setIsGlassExpanded(!isGlassExpanded)),
                    ]}
                  />
                  <Text>{isGlassExpanded ? 'Tap to collapse' : 'Tap to expand glass effects'}</Text>
                </VStack>
              </NamespaceProvider>
            </VStack>
          </Section>

          <GlassEffectContainer spacing={40}>
            <HStack
              spacing={40}
              modifiers={[
                padding({ all: 20 }),
                animation(Animation.springDuration(1), isGlassExpanded),
              ]}>
              <Image
                systemName="scribble.variable"
                size={36}
                color="#000"
                modifiers={[
                  padding({ all: 10 }),
                  glassEffect({
                    glass: {
                      variant: 'clear',
                    },
                  }),
                ]}
              />
              <Image
                systemName="eraser.fill"
                size={36}
                color="#000"
                modifiers={[
                  padding({ all: 10 }),
                  glassEffect({
                    glass: {
                      variant: 'clear',
                    },
                  }),
                  offset({ x: isGlassExpanded ? 0 : -40, y: 0 }),
                ]}
              />
            </HStack>
          </GlassEffectContainer>
        </VStack>
      </Host>
    </View>
  );
}
