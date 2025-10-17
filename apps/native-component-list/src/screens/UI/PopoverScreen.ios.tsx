import { Button, Host, HStack, Image, Picker, Popover, Text, VStack } from '@expo/ui/swift-ui';
import { background, clipShape, onTapGesture, padding } from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { Alert } from 'react-native';

export default function PopoverScreen() {
  const [showPop, setShowPop] = React.useState<boolean>(true);
  const [textShowPop, setTextShowPop] = React.useState<boolean>(false);
  const [iconShowPop, setIconShowPop] = React.useState<boolean>(false);

  const attachmentAnchorOptions = ['leading', 'trailing', 'center', 'top', 'bottom'] as const;
  const arrowEdgeOptions = ['leading', 'trailing', 'top', 'bottom'] as const;
  const [attachmentAnchor, setAttachmentAnchor] = React.useState<number>(0);
  const [arrowEdge, setArrowEdge] = React.useState<number>(0);

  return (
    <Host matchContents>
      <VStack spacing={40}>
        <VStack spacing={20}>
          <Text>Attachment Anchor</Text>
          <Picker
            options={[...attachmentAnchorOptions]}
            selectedIndex={attachmentAnchor}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setAttachmentAnchor(index);
            }}
            variant="segmented"
          />
          <Text>Arrow edge</Text>
          <Picker
            options={[...arrowEdgeOptions]}
            selectedIndex={arrowEdge}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setArrowEdge(index);
            }}
            variant="segmented"
          />
        </VStack>

        <HStack spacing={60}>
          <Popover
            isPresented={showPop}
            onStateChange={(e) => setShowPop(e.isPresented)}
            popoverView={
              <VStack modifiers={[padding({ all: 20 })]}>
                <Text size={16}>Hello is button popover</Text>
              </VStack>
            }
            attachmentAnchor={attachmentAnchorOptions[attachmentAnchor]}
            arrowEdge={arrowEdgeOptions[arrowEdge]}>
            <Button onPress={() => setShowPop(true)}>Button Popover</Button>
          </Popover>
          <Popover
            isPresented={textShowPop}
            onStateChange={(e) => setTextShowPop(e.isPresented)}
            popoverView={
              <VStack modifiers={[padding({ all: 20 })]}>
                <Text size={16}>Hello is text popover</Text>
              </VStack>
            }>
            <Text modifiers={[onTapGesture(() => setTextShowPop(true))]}>Text Popover</Text>
          </Popover>
        </HStack>

        <Popover
          isPresented={iconShowPop}
          onStateChange={(e) => setIconShowPop(e.isPresented)}
          popoverView={
            <VStack modifiers={[padding({ all: 20 })]} spacing={10}>
              <HStack alignment="center" spacing={6}>
                <Image systemName="star.fill" size={24} color="green" />
                <Text size={18}>Hello is icon popover</Text>
              </HStack>
              <Button
                variant={isLiquidGlassAvailable() ? 'glassProminent' : 'borderedProminent'}
                onPress={() => Alert.alert('This allert from popover!')}>
                Press me
              </Button>
            </VStack>
          }
          arrowEdge="top"
          attachmentAnchor="bottom">
          <VStack modifiers={[background('gray'), clipShape('circle')]}>
            <Image
              systemName="house"
              size={24}
              modifiers={[padding({ all: 10 }), onTapGesture(() => setIconShowPop(true))]}
            />
          </VStack>
        </Popover>
      </VStack>
    </Host>
  );
}

PopoverScreen.navigationOptions = {
  title: 'Popover',
};
