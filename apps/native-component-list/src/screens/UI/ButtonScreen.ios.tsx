import {
  Button,
  CircularProgress,
  Form,
  Host,
  HStack,
  Image,
  Label,
  Text,
  List,
  VStack,
  Section,
  Rectangle,
  BottomSheet,
} from '@expo/ui/swift-ui';
import { background, frame } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';

const RNHostView = requireNativeViewManager('ExpoUI', 'RNHostView');

console.log('RNHostView', RNHostView);

export default function ButtonScreen() {
  const [isOpened, setIsOpened] = React.useState<boolean>(false);
  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={10}>
        <Rectangle />
        <RNHostView>
          <Pressable
            onPress={() => {
              console.log('Pressable onPress');
              setIsOpened(true);
            }}
            style={{ flex: 1, backgroundColor: 'red' }}></Pressable>
        </RNHostView>
        <BottomSheet
          isOpened={isOpened}
          onIsOpenedChange={setIsOpened}
          presentationDetents={['medium', 'large']}>
          <RNHostView>
            <Pressable
              testID="Hello world"
              style={{ flex: 1, backgroundColor: 'pink' }}
              onPress={() => {
                console.log('Pressable onPress 13');
              }}>
              <View style={{ width: 100, height: 100, backgroundColor: 'blue' }} />
            </Pressable>
          </RNHostView>
        </BottomSheet>
      </VStack>
    </Host>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 150,
    margin: 5,
    marginLeft: 20,
    overflow: 'visible',
  },
  buttonHost: {
    width: 50,
    height: 50,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  columnWrapper: {
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
});
