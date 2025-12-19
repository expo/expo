import {
  Button,
  BottomSheet,
  Host,
  HStack,
  List,
  VStack,
  Rectangle,
  RNHostView,
  Section,
  Switch,
  PresentationDragIndicatorVisibility,
  PresentationBackgroundInteraction,
} from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { Pressable } from 'react-native';

export default function BottomSheetScreen() {
  const [bottomSheetOpen1, setBottomSheetOpen1] = React.useState<boolean>(false);
  const [bottomSheetOpen2, setBottomSheetOpen2] = React.useState<boolean>(false);
  const [enableDetent, setEnableDetent] = React.useState<boolean>(false);
  const [interactiveDismissDisabled, setInteractiveDismissDisabled] =
    React.useState<boolean>(false);
  const [presentationDragIndicator, setPresentationDragIndicator] =
    React.useState<PresentationDragIndicatorVisibility>('visible');
  const [bottomSheetOpen3, setBottomSheetOpen3] = React.useState<boolean>(false);
  const [enableBackgroundInteraction, setEnableBackgroundInteraction] =
    React.useState<boolean>(false);
  const [limitBackgroundInteraction, setLimitBackgroundInteraction] =
    React.useState<boolean>(false);

  const presentationBackgroundInteraction = React.useMemo(() => {
    if (!enableBackgroundInteraction) {
      return 'automatic';
    }
    if (limitBackgroundInteraction) {
      return {
        type: 'enabledUpThrough',
        detent: 0.2,
      } as const;
    }
    return 'enabled';
  }, [enableBackgroundInteraction, limitBackgroundInteraction]);

  const handleToggleBackgroundInteraction = React.useCallback((value: boolean) => {
    setEnableBackgroundInteraction(value);
    if (!value) {
      setLimitBackgroundInteraction(false);
    }
  }, []);

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <Section title="BottomSheet with SwiftUI content">
          <Button label="Open BottomSheet" onPress={() => setBottomSheetOpen1(!bottomSheetOpen1)} />
        </Section>
        <Section title="BottomSheet with React Native content">
          <Button label="Open BottomSheet" onPress={() => setBottomSheetOpen2(!bottomSheetOpen2)} />
        </Section>
        <Section title="BottomSheet with React Native content full height">
          <Button label="Open BottomSheet" onPress={() => setBottomSheetOpen3(!bottomSheetOpen3)} />
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
        <Switch
          value={enableBackgroundInteraction}
          onValueChange={handleToggleBackgroundInteraction}
          label="Enable background interaction"
        />
        <Switch
          value={limitBackgroundInteraction}
          onValueChange={() => setLimitBackgroundInteraction(!limitBackgroundInteraction)}
          label="Limit interaction up to small detent"
        />
      </List>
      <BottomSheetWithSwiftUIContent
        isOpened={bottomSheetOpen1}
        onIsOpenedChange={setBottomSheetOpen1}
        enableDetent={enableDetent}
        interactiveDismissDisabled={interactiveDismissDisabled}
        presentationDragIndicator={presentationDragIndicator}
        presentationBackgroundInteraction={presentationBackgroundInteraction}
      />
      <BottomSheetWithReactNativeContent
        isOpened={bottomSheetOpen2}
        onIsOpenedChange={setBottomSheetOpen2}
        enableDetent={enableDetent}
        interactiveDismissDisabled={interactiveDismissDisabled}
        presentationDragIndicator={presentationDragIndicator}
        presentationBackgroundInteraction={presentationBackgroundInteraction}
      />
      <BottomSheetWithReactNativeContentFullHeight
        isOpened={bottomSheetOpen3}
        onIsOpenedChange={setBottomSheetOpen3}
        enableDetent={enableDetent}
        interactiveDismissDisabled={interactiveDismissDisabled}
        presentationDragIndicator={presentationDragIndicator}
        presentationBackgroundInteraction={presentationBackgroundInteraction}
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
  presentationBackgroundInteraction: PresentationBackgroundInteraction;
}) => {
  const [height, setHeight] = React.useState<number>(100);
  return (
    <BottomSheet
      isOpened={props.isOpened}
      onIsOpenedChange={props.onIsOpenedChange}
      presentationDetents={props.enableDetent ? ['medium', 'large', 0.2] : undefined}
      interactiveDismissDisabled={props.interactiveDismissDisabled}
      presentationDragIndicator={props.presentationDragIndicator}
      presentationBackgroundInteraction={props.presentationBackgroundInteraction}>
      <VStack>
        <Rectangle modifiers={[frame({ width: 100, height })]} />
        <HStack spacing={20} modifiers={[frame({ maxWidth: Infinity, height: Infinity })]}>
          <Button
            label="Increase height"
            onPress={() => {
              setHeight(height + 10);
            }}
          />
        </HStack>
        <Button
          label="Close sheet"
          onPress={() => {
            props.onIsOpenedChange(false);
          }}
        />
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
  presentationBackgroundInteraction: PresentationBackgroundInteraction;
}) => {
  const [height, setHeight] = React.useState<number>(100);
  return (
    <BottomSheet
      isOpened={props.isOpened}
      onIsOpenedChange={props.onIsOpenedChange}
      presentationDetents={props.enableDetent ? ['medium', 'large', 0.2] : undefined}
      interactiveDismissDisabled={props.interactiveDismissDisabled}
      presentationBackgroundInteraction={props.presentationBackgroundInteraction}>
      <RNHostView matchContents>
        <Pressable
          style={{ backgroundColor: 'red', width: 100, height }}
          onPress={() => {
            setHeight(height + 10);
          }}
        />
      </RNHostView>
      <Button
        label="Close sheet"
        onPress={() => {
          props.onIsOpenedChange(false);
        }}
      />
    </BottomSheet>
  );
};

const BottomSheetWithReactNativeContentFullHeight = (props: {
  isOpened: boolean;
  onIsOpenedChange: (isOpened: boolean) => void;
  enableDetent: boolean;
  interactiveDismissDisabled: boolean;
  presentationDragIndicator: PresentationDragIndicatorVisibility;
  presentationBackgroundInteraction: PresentationBackgroundInteraction;
}) => {
  return (
    <BottomSheet
      isOpened={props.isOpened}
      onIsOpenedChange={props.onIsOpenedChange}
      presentationDetents={['large']}
      interactiveDismissDisabled={props.interactiveDismissDisabled}
      presentationBackgroundInteraction={props.presentationBackgroundInteraction}>
      <RNHostView>
        <Pressable style={{ backgroundColor: 'pink', flex: 1 }} />
      </RNHostView>
    </BottomSheet>
  );
};
BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
