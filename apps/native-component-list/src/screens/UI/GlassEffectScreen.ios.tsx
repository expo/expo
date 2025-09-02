import {
  Host,
  HStack,
  GlassEffectContainer,
  Image,
  Namespace,
  VStack,
  Button,
  Text,
} from '@expo/ui/swift-ui';
import {
  padding,
  glassEffect,
  animation,
  Animation,
  glassEffectId,
  background,
  cornerRadius,
  frame,
} from '@expo/ui/swift-ui/modifiers';
import { useId, useState } from 'react';
import { View } from 'react-native';

export default function GlassEffect() {
  const [isGlassExpanded, setIsGlassExpanded] = useState(false);
  const namespaceId = useId();

  return (
    <View
      style={{
        flex: 1,
        experimental_backgroundImage: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
      }}>
      <Host style={{ flex: 1 }}>
        <VStack
          spacing={60}
          modifiers={[animation(Animation.spring({ duration: 0.8 }), isGlassExpanded)]}>
          <Namespace id={namespaceId}>
            <GlassEffectContainer
              spacing={30}
              modifiers={[
                animation(Animation.spring({ duration: 0.8 }), isGlassExpanded),
                padding({ all: 30 }),
                cornerRadius(20),
              ]}>
              <VStack spacing={25}>
                <HStack spacing={25}>
                  <Image
                    systemName="paintbrush.fill"
                    size={42}
                    modifiers={[
                      frame({ width: 50, height: 50 }),
                      padding({ all: 15 }),
                      glassEffect({
                        glass: {
                          variant: 'clear',
                        },
                      }),
                      glassEffectId('paintbrush', namespaceId),
                      cornerRadius(15),
                    ]}
                  />
                  <Image
                    systemName="scribble.variable"
                    size={42}
                    modifiers={[
                      frame({ width: 50, height: 50 }),
                      padding({ all: 15 }),
                      glassEffect({
                        glass: {
                          variant: 'clear',
                        },
                      }),
                      glassEffectId('scribble', namespaceId),
                      cornerRadius(15),
                    ]}
                  />
                  <Image
                    systemName="pencil.tip.crop.circle"
                    size={42}
                    modifiers={[
                      frame({ width: 50, height: 50 }),
                      padding({ all: 15 }),
                      glassEffect({
                        glass: {
                          variant: 'clear',
                        },
                      }),
                      glassEffectId('pencil', namespaceId),
                      cornerRadius(15),
                    ]}
                  />
                </HStack>

                {isGlassExpanded && (
                  <HStack spacing={25}>
                    <Image
                      systemName="eraser.fill"
                      size={42}
                      modifiers={[
                        frame({ width: 50, height: 50 }),
                        padding({ all: 15 }),
                        glassEffect({
                          glass: {
                            variant: 'clear',
                          },
                        }),
                        glassEffectId('eraser', namespaceId),
                        cornerRadius(15),
                      ]}
                    />
                    <Image
                      systemName="highlighter"
                      size={42}
                      modifiers={[
                        frame({ width: 50, height: 50 }),
                        padding({ all: 15 }),
                        glassEffect({
                          glass: {
                            variant: 'clear',
                          },
                        }),
                        glassEffectId('highlighter', namespaceId),
                        cornerRadius(15),
                      ]}
                    />
                    <Image
                      systemName="heart.fill"
                      size={42}
                      modifiers={[
                        frame({ width: 50, height: 50 }),
                        padding({ all: 15 }),
                        glassEffect({
                          glass: {
                            variant: 'clear',
                          },
                        }),
                        glassEffectId('heart.fill', namespaceId),
                        cornerRadius(15),
                      ]}
                    />
                  </HStack>
                )}
              </VStack>
            </GlassEffectContainer>
          </Namespace>

          <VStack spacing={15}>
            <Button
              onPress={() => setIsGlassExpanded(!isGlassExpanded)}
              modifiers={[
                padding({ horizontal: 30, vertical: 15 }),
                background('#000'),
                cornerRadius(25),
                glassEffect({
                  glass: {
                    variant: 'clear',
                  },
                }),
              ]}>
              <Text color="#fff">{isGlassExpanded ? 'Hide Tools' : 'Show More Tools'}</Text>
            </Button>
          </VStack>
        </VStack>
      </Host>
    </View>
  );
}
