import {
  Host,
  Text as SwiftUIText,
  VStack,
  HStack,
  List,
  Section,
  RNHostView,
} from '@expo/ui/swift-ui';
import { frame, padding } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { Text as RNText, View, Pressable } from 'react-native';

export default function HostingRNViewsScreen() {
  const [counter, setCounter] = useState(0);
  const [boxSize, setBoxSize] = useState(200);

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="Mixing RN Components with SwiftUI">
          <VStack spacing={12} modifiers={[padding({ all: 12 })]}>
            <HStack spacing={24}>
              <RNHostView matchContents>
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
              </RNHostView>
              <SwiftUIText modifiers={[frame({ width: 50 })]}>{counter}</SwiftUIText>
              <RNHostView matchContents>
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
              </RNHostView>
            </HStack>
          </VStack>
        </Section>
        <Section title="Dynamically increasing size">
          <VStack spacing={12} modifiers={[padding({ all: 12 })]}>
            <HStack spacing={24}>
              <RNHostView matchContents>
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
              </RNHostView>
            </HStack>
          </VStack>
        </Section>
        <Section title="RN components without explicit size">
          <VStack>
            <HStack spacing={20} modifiers={[padding({ all: 12 })]}>
              <RNHostView matchContents>
                <View
                  style={{
                    padding: 20,
                    backgroundColor: '#9B59B6',
                    borderRadius: 10,
                    alignSelf: 'flex-start',
                  }}
                />
              </RNHostView>
              <RNHostView matchContents>
                <View
                  style={{
                    padding: 20,
                    backgroundColor: '#9B59B6',
                    borderRadius: 10,
                    alignSelf: 'flex-start',
                  }}
                />
              </RNHostView>
            </HStack>
            <RNHostView matchContents>
              <RNText style={{ textAlign: 'center' }}>
                RN component boxes separated by SwiftUI HStack
              </RNText>
            </RNHostView>
          </VStack>
        </Section>
      </List>
    </Host>
  );
}

HostingRNViewsScreen.navigationOptions = {
  title: 'Hosting RN Views',
};
