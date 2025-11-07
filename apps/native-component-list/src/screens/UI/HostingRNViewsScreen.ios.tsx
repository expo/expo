import { Host, Text as SwiftUIText, VStack, HStack, List, Section } from '@expo/ui/swift-ui';
import { background, frame, padding } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { Text as RNText, View, Pressable } from 'react-native';
import { RNHost } from '@expo/ui/swift-ui';

export default function HostingRNViewsScreen() {
  const [counter, setCounter] = useState(0);
  const [boxSize, setBoxSize] = useState(200);

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Mixing RN Components with SwiftUI">
          <VStack spacing={12} modifiers={[padding({ all: 12 })]}>
            <HStack spacing={24}>
              <RNHost>
                <Pressable
                  onPress={() => setCounter((prev) => prev - 1)}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#9B59B6',
                  }}>
                  <RNText
                    style={{
                      color: 'white',
                      fontSize: 24,
                    }}>
                    -
                  </RNText>
                </Pressable>
              </RNHost>
              <SwiftUIText modifiers={[frame({ width: 50 })]}>{counter}</SwiftUIText>
              <RNHost>
                <Pressable
                  onPress={() => setCounter((prev) => prev + 1)}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#9B59B6',
                  }}>
                  <RNText style={{ color: 'white', fontSize: 24 }}>+</RNText>
                </Pressable>
              </RNHost>
            </HStack>
          </VStack>
        </Section>
        <Section title="Dynamically increasing size">
          <VStack spacing={12} modifiers={[padding({ all: 12 })]}>
            <HStack spacing={24}>
              <RNHost>
                <Pressable
                  onPress={() => setBoxSize((prev) => prev + 10)}
                  style={{
                    height: boxSize,
                    width: boxSize,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#9B59B6',
                    gap: 10,
                  }}
                  onLongPress={() => setBoxSize(200)}>
                  <RNText style={{ color: 'white' }}>Tap to increase size</RNText>
                  <View style={{ height: 1, width: '100%', backgroundColor: 'white' }} />
                  <RNText style={{ color: 'white' }}>Long press to reset size</RNText>
                </Pressable>
              </RNHost>
            </HStack>
          </VStack>
        </Section>
        <Section title="RN components without explicit size">
          <VStack>
            <HStack spacing={20} modifiers={[padding({ all: 12 })]}>
              <RNHost>
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}>
                  <View
                    style={{
                      padding: 20,
                      backgroundColor: '#9B59B6',
                      borderRadius: 10,
                    }}
                  />
                  <View
                    style={{
                      padding: 20,
                      backgroundColor: '#9B59B6',
                      borderRadius: 10,
                    }}
                  />
                </View>
              </RNHost>
            </HStack>
            <RNHost>
              <RNText style={{ textAlign: 'center' }}>
                RN component boxes separated by SwiftUI HStack
              </RNText>
            </RNHost>
          </VStack>
        </Section>
      </List>
    </Host>
  );
}

HostingRNViewsScreen.navigationOptions = {
  title: 'Hosting RN Views',
};
