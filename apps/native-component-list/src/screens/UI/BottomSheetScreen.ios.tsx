import {
  Button,
  BottomSheet,
  Host,
  VStack,
  HStack,
  Switch,
  Text,
  List,
  Section,
  Form,
} from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import { Text as RNText, View, Pressable } from 'react-native';
import * as React from 'react';

export default function BottomSheetScreen() {
  const [bottomSheetOpen1, setBottomSheetOpen1] = React.useState<boolean>(false);
  const [bottomSheetOpen2, setBottomSheetOpen2] = React.useState<boolean>(false);
  console.log('BottomSheetScreen ', bottomSheetOpen1, bottomSheetOpen2);

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Button variant="default" onPress={() => setBottomSheetOpen1(!bottomSheetOpen1)}>
          Open BottomSheet
        </Button>
        <Button variant="default" onPress={() => setBottomSheetOpen2(!bottomSheetOpen2)}>
          Open BottomSheet
        </Button>
      </List>
      <BottomSheetWithSwiftUIContent
        isOpened={bottomSheetOpen1}
        onIsOpenedChange={setBottomSheetOpen1}
      />
      {/* <BottomSheetWithReactNativeContent
        isOpened={bottomSheetOpen2}
        onIsOpenedChange={setBottomSheetOpen2}
      /> */}
    </Host>
  );
}

const BottomSheetWithSwiftUIContent = (props: {
  isOpened: boolean;
  onIsOpenedChange: (isOpened: boolean) => void;
}) => {
  return (
    <Host style={{ position: 'absolute' }} pointerEvents="none">
      <BottomSheet
        includeChildrenHeightDetent
        isOpened={props.isOpened}
        onIsOpenedChange={props.onIsOpenedChange}>
        <HStack
          alignment="center"
          spacing={20}
          modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'center' })]}>
          <Text>Left</Text>
          <Text>Middle</Text>
          <Text>Right</Text>
          {/* <Button
            variant="default"
            onPress={() => {
              console.log('Button onPress');
            }}>
            Increase height
          </Button> */}
          <Pressable
            style={{ height: 100, width: 80, backgroundColor: 'red' }}
            onPress={() => {
              console.log('Pressable onPress');
              props.onIsOpenedChange(!props.isOpened);
            }}>
            <RNText>Increase height</RNText>
          </Pressable>
        </HStack>
      </BottomSheet>
    </Host>
  );
};

const BottomSheetWithReactNativeContent = (props: {
  isOpened: boolean;
  onIsOpenedChange: (isOpened: boolean) => void;
}) => {
  const [height, setHeight] = React.useState<number>(100);
  return (
    <Host style={{ position: 'absolute' }}>
      <BottomSheet isOpened={props.isOpened} onIsOpenedChange={props.onIsOpenedChange}>
        <View
          style={{
            height: height,
            width: 400,
            backgroundColor: 'green',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}>
          <RNText>Hello</RNText>
          <Pressable
            onPress={() => {
              console.log('Pressable onPress');
              setHeight(height + 10);
            }}
            style={{ height: 100, width: 100, backgroundColor: 'red' }}>
            <RNText>Tap to increase height</RNText>
          </Pressable>
        </View>
      </BottomSheet>
    </Host>
  );
};

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
