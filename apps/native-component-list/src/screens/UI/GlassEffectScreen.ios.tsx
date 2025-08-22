import { Host, HStack, NamespaceProvider, VStack, NAMESPACES, Text } from '@expo/ui/swift-ui';
import {
  padding,
  animation,
  Animation,
  background,
  cornerRadius,
  frame,
  matchedGeometryEffect,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { View } from 'react-native';

export default function GlassEffect() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        experimental_backgroundImage: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
      }}>
      <Host style={{ flex: 1 }}>
        <VStack
          spacing={20}
          modifiers={[animation(Animation.spring(), isFlipped), padding({ all: 40 })]}
          onPress={() => setIsFlipped(!isFlipped)}>
          <NamespaceProvider>
            <VStack spacing={30}>
              {isFlipped ? (
                <>
                  <HStack
                    modifiers={[
                      frame({ width: 44, height: 44 }),
                      background('#FF3B30'),
                      cornerRadius(8),
                      matchedGeometryEffect('Shape', NAMESPACES.$1),
                    ]}
                  />
                  <Text
                    color="#fff"
                    modifiers={[matchedGeometryEffect('AlbumTitle', NAMESPACES.$1)]}>
                    Linkin Park
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    color="#fff"
                    modifiers={[matchedGeometryEffect('AlbumTitle', NAMESPACES.$1)]}>
                    Linkin Park
                  </Text>
                  <HStack
                    modifiers={[
                      frame({ width: 44, height: 44 }),
                      background('#007AFF'),
                      cornerRadius(8),
                      matchedGeometryEffect('Shape', NAMESPACES.$1),
                    ]}></HStack>
                </>
              )}
            </VStack>
          </NamespaceProvider>
        </VStack>
      </Host>
    </View>
  );
}
