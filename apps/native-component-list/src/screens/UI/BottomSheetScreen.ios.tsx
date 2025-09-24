import { Button, BottomSheet, Host, VStack, HStack, Switch, Text } from '@expo/ui/swift-ui';
import { fixedSize, frame, padding } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { ScrollView } from 'react-native';

export default function BottomSheetScreen() {
  const [isOpened, setIsOpened] = React.useState<boolean>(false);
  const [interactiveDismissDisabled, setInteractiveDismissDisabled] =
    React.useState<boolean>(false);
  const [hideDragIndicator, setHideDragIndicator] = React.useState<boolean>(false);

  const handleDismiss = () => {
    console.log('BottomSheet was dismissed');
  };

  return (
    <ScrollView>
      <Host matchContents>
        <VStack alignment="leading" modifiers={[padding({ all: 16 })]} spacing={16}>
          <Button onPress={() => setIsOpened(true)}>Open BottomSheet</Button>
          <HStack>
            <Text modifiers={[fixedSize()]}>Disable interactive dismiss</Text>
            <Switch
              value={interactiveDismissDisabled}
              onValueChange={setInteractiveDismissDisabled}
            />
          </HStack>
          <HStack>
            <Text modifiers={[fixedSize()]}>Hide drag indicator</Text>
            <Switch value={hideDragIndicator} onValueChange={setHideDragIndicator} />
          </HStack>
        </VStack>
      </Host>

      <Host style={{ position: 'absolute' }} matchContents>
        <BottomSheet
          isOpened={isOpened}
          onIsOpenedChange={setIsOpened}
          interactiveDismissDisabled={interactiveDismissDisabled}
          presentationDetents={['medium', 'large', 0.2]}
          onDismiss={handleDismiss}
          presentationDragIndicator={hideDragIndicator ? 'hidden' : 'automatic'}>
          <HStack modifiers={[frame({ height: 100 })]}>
            <Button onPress={() => setIsOpened(false)}>Close BottomSheet</Button>
          </HStack>
        </BottomSheet>
      </Host>
    </ScrollView>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
