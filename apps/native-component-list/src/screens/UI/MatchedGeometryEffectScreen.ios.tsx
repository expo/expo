import { Host, HStack, Namespace, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  padding,
  animation,
  Animation,
  background,
  cornerRadius,
  frame,
  matchedGeometryEffect,
} from '@expo/ui/swift-ui/modifiers';
import { useId, useState } from 'react';
import { View } from 'react-native';

const boxes = ['box1', 'box2', 'box3', 'box4', 'box5', 'box6'];
const colors = ['#FF3B30', '#007AFF', '#28CD41', '#FF9500', '#AF52DE', '#FF2D92'];

export default function MatchedGeometryEffectDemo() {
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const namespaceId = useId();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Host style={{ flex: 1 }}>
        <Namespace id={namespaceId}>
          <ZStack modifiers={[animation(Animation.spring(), !!selectedBox)]}>
            {selectedBox === null ? (
              <VStack spacing={20} modifiers={[padding({ all: 20 })]}>
                <HStack spacing={20}>
                  {boxes.slice(0, 3).map((boxId, index) => (
                    // TODO: Add Rectangle component
                    //  @ts-expect-error
                    <HStack
                      key={boxId}
                      modifiers={[
                        frame({ width: 100, height: 100 }),
                        background(colors[index]),
                        cornerRadius(12),
                        matchedGeometryEffect(boxId, namespaceId),
                      ]}
                      onPress={() => setSelectedBox(boxId)}
                    />
                  ))}
                </HStack>

                <HStack spacing={20}>
                  {boxes.slice(3, 6).map((boxId, index) => (
                    // TODO: Add Rectangle component
                    //  @ts-expect-error
                    <HStack
                      key={boxId}
                      modifiers={[
                        frame({ width: 100, height: 100 }),
                        background(colors[index + 3]),
                        cornerRadius(12),
                        matchedGeometryEffect(boxId, namespaceId),
                      ]}
                      onPress={() => setSelectedBox(boxId)}
                    />
                  ))}
                </HStack>
              </VStack>
            ) : (
              <ZStack onPress={() => setSelectedBox(null)}>
                <HStack
                  modifiers={[
                    frame({ maxWidth: Infinity, maxHeight: Infinity }),
                    padding({ all: 40 }),
                  ]}>
                  <VStack>
                    {/* TODO: Add Rectangle component */}
                    {/* @ts-expect-error */}
                    <HStack
                      modifiers={[
                        padding({ all: 40 }),
                        background(colors[boxes.indexOf(selectedBox)]),
                        cornerRadius(12),
                        matchedGeometryEffect(selectedBox, namespaceId),
                      ]}
                    />
                  </VStack>
                </HStack>
              </ZStack>
            )}
          </ZStack>
        </Namespace>
      </Host>
    </View>
  );
}
