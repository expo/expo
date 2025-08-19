import {
  Host,
  HStack,
  NamespaceProvider,
  GlassEffectContainer,
  Image,
  VStack,
  Button,
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
  unmount,
  NAMESPACES,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { View } from 'react-native';

export default function GlassEffect() {
  const [isGlassExpanded, setIsGlassExpanded] = useState(false);
  return (
    <View
      style={{
        flex: 1,
        experimental_backgroundImage: `linear-gradient(to bottom,  rgba(0, 0, 0, 0.8), transparent)`,
      }}>
      <Host style={{ width: 400, height: 400 }}>
        <VStack spacing={40}>
          <NamespaceProvider>
            <GlassEffectContainer
              spacing={40}
              modifiers={[animation(Animation.springDuration(1), isGlassExpanded)]}>
              <HStack spacing={40}>
                <Image
                  systemName="scribble.variable"
                  size={40}
                  modifiers={[
                    padding({ all: 10 }),
                    glassEffect({
                      glass: {
                        variant: 'clear',
                      },
                    }),
                    glassEffectId('scribble', NAMESPACES.$1),
                  ]}
                />
                {isGlassExpanded ? (
                  <Image
                    systemName="eraser.fill"
                    size={40}
                    modifiers={[
                      padding({ all: 10 }),
                      glassEffect({
                        glass: {
                          variant: 'clear',
                        },
                      }),
                      glassEffectId('eraser', NAMESPACES.$1),
                    ]}
                  />
                ) : null}
              </HStack>
            </GlassEffectContainer>
          </NamespaceProvider>
          <Button onPress={() => setIsGlassExpanded(!isGlassExpanded)}>Toggle</Button>
        </VStack>
      </Host>
    </View>
  );
}
