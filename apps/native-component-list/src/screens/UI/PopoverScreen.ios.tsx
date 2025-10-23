import { Button, Host, HStack, Image, Picker, Popover, Text, VStack } from '@expo/ui/swift-ui';
import { background, clipShape, frame, onTapGesture, padding } from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { Alert, ScrollView, Text as RNText } from 'react-native';

export default function PopoverScreen() {
  const [showPop, setShowPop] = React.useState<boolean>(true);
  const [textShowPop, setTextShowPop] = React.useState<boolean>(false);
  const [iconShowPop, setIconShowPop] = React.useState<boolean>(false);
  const [scrollShowPop, setScrollShowPop] = React.useState<boolean>(false);
  const [imageShowPop, setImageShowPop] = React.useState<boolean>(false);

  const attachmentAnchorOptions = ['leading', 'trailing', 'center', 'top', 'bottom'] as const;
  const arrowEdgeOptions = ['leading', 'trailing', 'top', 'bottom'] as const;
  const [attachmentAnchor, setAttachmentAnchor] = React.useState<number>(0);
  const [arrowEdge, setArrowEdge] = React.useState<number>(0);

  return (
    <Host matchContents>
      <VStack spacing={40} alignment="leading" modifiers={[padding({ horizontal: 20 })]}>
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

        <VStack alignment="center">
          <HStack spacing={60}>
            <Popover
              isPresented={showPop}
              onStateChange={(e) => setShowPop(e.isPresented)}
              attachmentAnchor={attachmentAnchorOptions[attachmentAnchor]}
              arrowEdge={arrowEdgeOptions[arrowEdge]}>
              <Popover.Content>
                <VStack modifiers={[padding({ all: 20 })]}>
                  <Text size={16}>Hello is button popover</Text>
                </VStack>
              </Popover.Content>
              <Popover.Trigger>
                <Button variant="borderedProminent" onPress={() => setShowPop(true)}>
                  Button Popover
                </Button>
              </Popover.Trigger>
            </Popover>
            <Popover isPresented={textShowPop} onStateChange={(e) => setTextShowPop(e.isPresented)}>
              <Popover.Content>
                <VStack modifiers={[padding({ all: 20 })]}>
                  <Text size={16}>Hello is text popover</Text>
                </VStack>
              </Popover.Content>
              <Popover.Trigger>
                <Text modifiers={[onTapGesture(() => setTextShowPop(true))]}>Text Popover</Text>
              </Popover.Trigger>
            </Popover>
          </HStack>
        </VStack>

        <HStack>
          <Popover
            isPresented={iconShowPop}
            onStateChange={(e) => setIconShowPop(e.isPresented)}
            attachmentAnchor={attachmentAnchorOptions[attachmentAnchor]}
            arrowEdge={arrowEdgeOptions[arrowEdge]}>
            <Popover.Content>
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
            </Popover.Content>
            <Popover.Trigger>
              <VStack modifiers={[background('gray'), clipShape('circle')]}>
                <Image
                  systemName="house"
                  size={24}
                  modifiers={[padding({ all: 10 }), onTapGesture(() => setIconShowPop(true))]}
                />
              </VStack>
            </Popover.Trigger>
          </Popover>
        </HStack>

        <HStack spacing={20}>
          <Popover
            isPresented={scrollShowPop}
            onStateChange={(e) => setScrollShowPop(e.isPresented)}
            attachmentAnchor={attachmentAnchorOptions[attachmentAnchor]}
            arrowEdge={arrowEdgeOptions[arrowEdge]}>
            <Popover.Content>
              <VStack modifiers={[frame({ width: 200, height: 150 })]}>
                <ScrollView contentContainerStyle={{ width: 200, padding: 20, gap: 4 }}>
                  <RNText style={{ fontSize: 16, fontWeight: '700' }}>
                    Scroll content inside popover
                  </RNText>
                  {['1', '2', '3', '4', '5', '6'].map((i, index) => (
                    <RNText
                      key={index}
                      style={{
                        backgroundColor: 'green',
                        padding: 4,
                        borderRadius: 6,
                        color: 'white',
                      }}>
                      {i}
                    </RNText>
                  ))}
                  <Host matchContents>
                    <Button
                      variant={isLiquidGlassAvailable() ? 'glassProminent' : 'borderedProminent'}
                      onPress={() => Alert.alert('This allert from popover!')}>
                      Press me
                    </Button>
                  </Host>
                </ScrollView>
              </VStack>
            </Popover.Content>
            <Popover.Trigger>
              <Button variant="borderedProminent" onPress={() => setScrollShowPop(true)}>
                ScrollView Popover
              </Button>
            </Popover.Trigger>
          </Popover>
          <Popover
            isPresented={imageShowPop}
            onStateChange={(e) => setImageShowPop(e.isPresented)}
            attachmentAnchor={attachmentAnchorOptions[attachmentAnchor]}
            arrowEdge={arrowEdgeOptions[arrowEdge]}>
            <Popover.Content>
              <VStack modifiers={[frame({ width: 400, height: 200 })]}>
                <ExpoImage
                  source={require('../../../assets/images/example2.jpg')}
                  style={{ width: 400, height: 200 }}
                />
              </VStack>
            </Popover.Content>
            <Popover.Trigger>
              <Button variant="borderedProminent" onPress={() => setImageShowPop(true)}>
                Image popover
              </Button>
            </Popover.Trigger>
          </Popover>
        </HStack>
      </VStack>
    </Host>
  );
}

PopoverScreen.navigationOptions = {
  title: 'Popover',
};
