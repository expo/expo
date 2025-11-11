import {
  Button,
  BottomSheet,
  Host,
  HStack,
  Text,
  List,
  VStack,
  Rectangle,
  RNHost,
  Section,
  Switch,
  PresentationDragIndicatorVisibility,
} from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import { Pressable } from 'react-native';
import * as React from 'react';

export default function BottomSheetScreen() {
  const [bottomSheetOpen1, setBottomSheetOpen1] = React.useState<boolean>(false);
  const [bottomSheetOpen2, setBottomSheetOpen2] = React.useState<boolean>(false);
  const [enableDetent, setEnableDetent] = React.useState<boolean>(false);
  const [interactiveDismissDisabled, setInteractiveDismissDisabled] =
    React.useState<boolean>(false);
  const [presentationDragIndicator, setPresentationDragIndicator] =
    React.useState<PresentationDragIndicatorVisibility>('automatic');

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="BottomSheet with SwiftUI content">
          <Button variant="default" onPress={() => setBottomSheetOpen1(!bottomSheetOpen1)}>
            Open BottomSheet
          </Button>
        </Section>
        <Section title="BottomSheet with React Native content">
          <Button variant="default" onPress={() => setBottomSheetOpen2(!bottomSheetOpen2)}>
            Open BottomSheet
          </Button>
        </Section>
        <Switch
          value={enableDetent}
          onValueChange={() => setEnableDetent(!enableDetent)}
          label="Enable detent"
        />
        <Switch
          value={interactiveDismissDisabled}
          onValueChange={() => setInteractiveDismissDisabled(!interactiveDismissDisabled)}
          label="Interactive dismiss disabled"
        />
        <Switch
          value={presentationDragIndicator === 'visible'}
          onValueChange={() =>
            setPresentationDragIndicator(
              presentationDragIndicator === 'visible' ? 'automatic' : 'visible'
            )
          }
          label="Presentation drag indicator visible"
        />
      </List>
      <BottomSheetWithSwiftUIContent
        isOpened={bottomSheetOpen1}
        onIsOpenedChange={setBottomSheetOpen1}
        enableDetent={enableDetent}
        interactiveDismissDisabled={interactiveDismissDisabled}
        presentationDragIndicator={presentationDragIndicator}
      />
      <BottomSheetWithReactNativeContent
        isOpened={bottomSheetOpen2}
        onIsOpenedChange={setBottomSheetOpen2}
        enableDetent={enableDetent}
        interactiveDismissDisabled={interactiveDismissDisabled}
        presentationDragIndicator={presentationDragIndicator}
      />
    </Host>
  );
}

const BottomSheetWithSwiftUIContent = (props: {
  isOpened: boolean;
  onIsOpenedChange: (isOpened: boolean) => void;
  enableDetent: boolean;
  interactiveDismissDisabled: boolean;
  presentationDragIndicator: PresentationDragIndicatorVisibility;
}) => {
  const [height, setHeight] = React.useState<number>(100);
  return (
    <BottomSheet
      isOpened={props.isOpened}
      onIsOpenedChange={props.onIsOpenedChange}
      presentationDetents={props.enableDetent ? ['medium', 'large'] : undefined}
      interactiveDismissDisabled={props.interactiveDismissDisabled}
      presentationDragIndicator={props.presentationDragIndicator}>
      <VStack>
        <Rectangle modifiers={[frame({ width: 100, height })]} />
        <HStack spacing={20} modifiers={[frame({ maxWidth: Infinity, height: Infinity })]}>
          <Button
            variant="default"
            onPress={() => {
              setHeight(height + 10);
            }}>
            Increase height
          </Button>
        </HStack>
        <Button
          variant="default"
          onPress={() => {
            props.onIsOpenedChange(false);
          }}>
          Close sheet
        </Button>
      </VStack>
    </BottomSheet>
  );
};

const BottomSheetWithReactNativeContent = (props: {
  isOpened: boolean;
  onIsOpenedChange: (isOpened: boolean) => void;
  enableDetent: boolean;
  interactiveDismissDisabled: boolean;
  presentationDragIndicator: PresentationDragIndicatorVisibility;
}) => {
  const [height, setHeight] = React.useState<number>(100);
  return (
    <BottomSheet
      isOpened={props.isOpened}
      onIsOpenedChange={props.onIsOpenedChange}
      presentationDetents={props.enableDetent ? ['medium', 'large'] : undefined}
      interactiveDismissDisabled={props.interactiveDismissDisabled}>
      <RNHost matchContents>
        <Pressable
          style={{ backgroundColor: 'red', width: 100, height }}
          onPress={() => {
            setHeight(height + 10);
          }}
        />
      </RNHost>
      <Button
        variant="default"
        onPress={() => {
          props.onIsOpenedChange(false);
        }}>
        Close sheet
      </Button>
    </BottomSheet>
  );
};

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
