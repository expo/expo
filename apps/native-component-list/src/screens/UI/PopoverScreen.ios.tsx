import {
  Button,
  Form,
  Host,
  LabeledContent,
  Picker,
  Popover,
  RNHostView,
  Section,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  frame,
  padding,
  pickerStyle,
  tag,
  presentationCompactAdaptation,
} from '@expo/ui/swift-ui/modifiers';
import React, { useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';

const attachmentAnchorOptions = ['center', 'leading', 'trailing', 'top', 'bottom'] as const;
const arrowEdgeOptions = ['none', 'leading', 'trailing', 'top', 'bottom'] as const;

type AttachmentAnchor = (typeof attachmentAnchorOptions)[number];
type ArrowEdge = (typeof arrowEdgeOptions)[number];

export default function PopoverScreen() {
  const [showBasicPopover, setShowBasicPopover] = useState(false);
  const [showConfiguredPopover, setShowConfiguredPopover] = useState(false);
  const [showRNPopover, setShowRNPopover] = useState(false);
  const [attachmentAnchor, setAttachmentAnchor] = useState<AttachmentAnchor>('center');
  const [arrowEdge, setArrowEdge] = useState<ArrowEdge>('none');
  const [counter, setCounter] = useState(0);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Basic Popover">
          <Popover isPresented={showBasicPopover} onIsPresentedChange={setShowBasicPopover}>
            <Popover.Trigger>
              <Button onPress={() => setShowBasicPopover(true)}>Show Popover</Button>
            </Popover.Trigger>
            <Popover.Content modifiers={[presentationCompactAdaptation('popover')]}>
              <VStack modifiers={[padding({ all: 16 }), frame({ minWidth: 200 })]}>
                <Text>Hello from Popover!</Text>
                <Text color="#666666">This is the popover content.</Text>
              </VStack>
            </Popover.Content>
          </Popover>
        </Section>

        <Section title="Configuration">
          <Picker
            label="Attachment Anchor"
            modifiers={[pickerStyle('menu')]}
            selection={attachmentAnchorOptions.indexOf(attachmentAnchor)}
            onSelectionChange={(index) => setAttachmentAnchor(attachmentAnchorOptions[index])}>
            {attachmentAnchorOptions.map((option, index) => (
              <Text key={option} modifiers={[tag(index)]}>
                {option}
              </Text>
            ))}
          </Picker>
          <Picker
            label="Arrow Edge"
            modifiers={[pickerStyle('menu')]}
            selection={arrowEdgeOptions.indexOf(arrowEdge)}
            onSelectionChange={(index) => setArrowEdge(arrowEdgeOptions[index])}>
            {arrowEdgeOptions.map((option, index) => (
              <Text key={option} modifiers={[tag(index)]}>
                {option}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section title="Configured Popover">
          <LabeledContent label="Settings">
            <Text color="#888888">
              anchor: {attachmentAnchor}, arrow: {arrowEdge}
            </Text>
          </LabeledContent>
          <Popover
            isPresented={showConfiguredPopover}
            onIsPresentedChange={setShowConfiguredPopover}
            attachmentAnchor={attachmentAnchor}
            arrowEdge={arrowEdge}>
            <Popover.Trigger>
              <Button onPress={() => setShowConfiguredPopover(true)}>Show Configured</Button>
            </Popover.Trigger>
            <Popover.Content>
              <VStack modifiers={[padding({ all: 16 }), frame({ minWidth: 250 })]}>
                <Text>Configured Popover</Text>
                <Text color="#666666">Attachment: {attachmentAnchor}</Text>
                <Text color="#666666">Arrow Edge: {arrowEdge}</Text>
              </VStack>
            </Popover.Content>
          </Popover>
        </Section>
        <Section title="Popover with React Native Content">
          <Popover
            isPresented={showRNPopover}
            onIsPresentedChange={setShowRNPopover}
            attachmentAnchor={attachmentAnchor}
            arrowEdge={arrowEdge}>
            <Popover.Trigger>
              <Button onPress={() => setShowRNPopover(true)}>Show RN Popover</Button>
            </Popover.Trigger>
            <Popover.Content>
              <RNHostView matchContents>
                <View style={{ padding: 24 }}>
                  <RNText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                    React Native Content
                  </RNText>
                  <RNText style={{ color: '#666', marginBottom: 12 }}>Counter: {counter}</RNText>
                  <Pressable
                    style={{
                      backgroundColor: '#007AFF',
                      padding: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => setCounter(counter + 1)}>
                    <RNText style={{ color: 'white', fontWeight: '600' }}>Increment</RNText>
                  </Pressable>
                </View>
              </RNHostView>
            </Popover.Content>
          </Popover>
        </Section>
      </Form>
    </Host>
  );
}

PopoverScreen.navigationOptions = {
  title: 'Popover',
};
