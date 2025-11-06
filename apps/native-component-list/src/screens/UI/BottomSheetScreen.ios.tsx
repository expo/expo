import {
  Button,
  BottomSheet,
  Host,
  HStack,
  Text,
  List,
  VStack,
  Rectangle,
} from '@expo/ui/swift-ui';
import { background, frame } from '@expo/ui/swift-ui/modifiers';
import { Pressable } from 'react-native';
import * as React from 'react';

export default function BottomSheetScreen() {
  const [bottomSheetOpen1, setBottomSheetOpen1] = React.useState<boolean>(false);
  const [bottomSheetOpen2, setBottomSheetOpen2] = React.useState<boolean>(false);

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
      <BottomSheetWithReactNativeContent
        isOpened={bottomSheetOpen2}
        onIsOpenedChange={setBottomSheetOpen2}
      />
    </Host>
  );
}

const BottomSheetWithSwiftUIContent = (props: {
  isOpened: boolean;
  onIsOpenedChange: (isOpened: boolean) => void;
}) => {
  const [height, setHeight] = React.useState<number>(100);
  return (
    <BottomSheet isOpened={props.isOpened} onIsOpenedChange={props.onIsOpenedChange}>
      <VStack>
        <Rectangle modifiers={[frame({ width: 100, height })]} />
        <HStack spacing={20} modifiers={[frame({ maxWidth: Infinity, height: Infinity })]}>
          <Text>Left</Text>
          <Text>Middle</Text>
          <Text>Right</Text>
          <Button
            variant="default"
            onPress={() => {
              setHeight(height + 10);
            }}>
            Increase height
          </Button>
        </HStack>
      </VStack>
    </BottomSheet>
  );
};

const BottomSheetWithReactNativeContent = (props: {
  isOpened: boolean;
  onIsOpenedChange: (isOpened: boolean) => void;
}) => {
  const [height, setHeight] = React.useState<number>(100);
  return (
    <BottomSheet
      isOpened={props.isOpened}
      onIsOpenedChange={props.onIsOpenedChange}
      includeChildrenHeightDetent>
      <Pressable
        style={{ backgroundColor: 'red', width: 100, height }}
        onPress={() => {
          setHeight(height + 10);
        }}
      />
    </BottomSheet>
  );
};

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
