import { Host, HStack, NamespaceProvider, GlassEffectContainer, Image } from '@expo/ui/swift-ui';
import { padding, offset, glassEffect } from '@expo/ui/swift-ui/modifiers';
import { View } from 'react-native';

export default function GlassEffect() {
  return (
    <View
      style={{
        flex: 1,
        experimental_backgroundImage:
          'linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5))',
      }}>
      <Host matchContents style={{ height: 100 }}>
        <GlassEffectContainer spacing={40}>
          <HStack spacing={40} modifiers={[padding({ all: 20 })]}>
            <Image
              systemName="scribble.variable"
              size={36}
              color="#000"
              modifiers={[
                padding({ all: 10 }),
                glassEffect({
                  glass: {
                    variant: 'clear',
                    interactive: true,
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
                    interactive: true,
                  },
                }),
                offset({ x: -40, y: 0 }),
              ]}
            />
          </HStack>
        </GlassEffectContainer>
      </Host>
    </View>
  );
}
