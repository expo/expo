import {
  Button,
  BottomSheet,
  Form,
  Host,
  Picker,
  RNHostView,
  Section,
  Text,
  Toggle,
  VStack,
  Group,
} from '@expo/ui/swift-ui';
import {
  frame,
  padding,
  pickerStyle,
  presentationDetents,
  presentationDragIndicator,
  presentationBackgroundInteraction,
  interactiveDismissDisabled,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import type { PresentationDetent } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';

const dragIndicatorOptions = ['automatic', 'visible', 'hidden'] as const;

type DragIndicatorOption = (typeof dragIndicatorOptions)[number];

export default function BottomSheetScreen() {
  const [showBasic, setShowBasic] = React.useState(false);

  const [showFitsContent, setShowFitsContent] = React.useState(false);

  const [showConfigured, setShowConfigured] = React.useState(false);
  const [useMedium, setUseMedium] = React.useState(true);
  const [useLarge, setUseLarge] = React.useState(true);
  const [useFraction, setUseFraction] = React.useState(false);
  const [dragIndicator, setDragIndicator] = React.useState<DragIndicatorOption>('automatic');
  const [backgroundInteractionEnabled, setBackgroundInteractionEnabled] = React.useState(false);
  const [dismissDisabled, setDismissDisabled] = React.useState(false);

  const [showRNContent, setShowRNContent] = React.useState(false);
  const [showRNContentWithFlex1, setShowRNContentWithFlex1] = React.useState(false);
  const [counter, setCounter] = React.useState(0);

  const configuredDetents: PresentationDetent[] = (() => {
    const detents: PresentationDetent[] = [];
    if (useMedium) detents.push('medium');
    if (useLarge) detents.push('large');
    if (useFraction) detents.push({ fraction: 0.3 });
    return detents.length > 0 ? detents : ['large'];
  })();

  const configuredModifiers = (() => {
    const mods = [presentationDetents(configuredDetents), presentationDragIndicator(dragIndicator)];

    if (backgroundInteractionEnabled) {
      mods.push(presentationBackgroundInteraction('enabled'));
    }

    if (dismissDisabled) {
      mods.push(interactiveDismissDisabled());
    }

    return mods;
  })();

  const formatDetent = (detent: PresentationDetent): string => {
    if (typeof detent === 'string') return detent;
    if ('fraction' in detent) return `${detent.fraction * 100}%`;
    return `${detent.height}pt`;
  };

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Basic">
          <Button label="Open Basic Sheet" onPress={() => setShowBasic(true)} />
        </Section>

        <Section title="Fits Content">
          <Text color="secondaryLabel">Sheet automatically sizes to fit its content</Text>
          <Button label="Open Fits Content Sheet" onPress={() => setShowFitsContent(true)} />
        </Section>

        <Section title="Configured Sheet">
          <Button label="Open Configured Sheet" onPress={() => setShowConfigured(true)} />
          <Toggle isOn={useMedium} onIsOnChange={setUseMedium} label="Medium" />
          <Toggle isOn={useLarge} onIsOnChange={setUseLarge} label="Large" />
          <Toggle isOn={useFraction} onIsOnChange={setUseFraction} label="30% (Fraction)" />
          <Picker
            label="Drag Indicator"
            modifiers={[pickerStyle('menu')]}
            selection={dragIndicatorOptions.indexOf(dragIndicator)}
            onSelectionChange={(index) => setDragIndicator(dragIndicatorOptions[index])}>
            {dragIndicatorOptions.map((option, index) => (
              <Text key={option} modifiers={[tag(index)]}>
                {option}
              </Text>
            ))}
          </Picker>
          <Toggle
            isOn={backgroundInteractionEnabled}
            onIsOnChange={setBackgroundInteractionEnabled}
            label="Background Interaction"
          />
          <Toggle
            isOn={dismissDisabled}
            onIsOnChange={setDismissDisabled}
            label="Dismiss Disabled"
          />
        </Section>

        <Section title="React Native Content">
          <Text color="secondaryLabel">Sheet with React Native views inside</Text>
          <Button label="Open RN Content Sheet" onPress={() => setShowRNContent(true)} />
        </Section>
        <Section title="React Native Content with flex 1 children">
          <Button
            label="Open RN Content Sheet with flex 1 children"
            onPress={() => setShowRNContentWithFlex1(true)}
          />
        </Section>
      </Form>

      {/* Basic Sheet */}
      <BottomSheet isPresented={showBasic} onIsPresentedChange={setShowBasic}>
        <Group modifiers={[presentationDetents(['medium', 'large'])]}>
          <VStack modifiers={[padding({ all: 20 })]}>
            <Text>Basic Bottom Sheet</Text>
            <Text color="secondaryLabel">Swipe down or tap outside to dismiss</Text>
            <Button label="Close" onPress={() => setShowBasic(false)} />
          </VStack>
        </Group>
      </BottomSheet>

      {/* Fits Content Sheet */}
      <BottomSheet
        isPresented={showFitsContent}
        onIsPresentedChange={setShowFitsContent}
        fitToContents>
        <Group>
          <VStack modifiers={[padding({ all: 20 })]}>
            <Text>Fits Content Sheet</Text>
            <Text color="secondaryLabel">This sheet sizes to fit its content automatically</Text>
            <Button label="Close" onPress={() => setShowFitsContent(false)} />
          </VStack>
        </Group>
      </BottomSheet>

      {/* Configured Sheet */}
      <BottomSheet isPresented={showConfigured} onIsPresentedChange={setShowConfigured}>
        <Group modifiers={configuredModifiers}>
          <VStack modifiers={[padding({ all: 20 }), frame({ minHeight: 200 })]}>
            <Text>Configured Sheet</Text>
            <Text color="secondaryLabel">
              Detents: {configuredDetents.map(formatDetent).join(', ')}
            </Text>
            <Text color="secondaryLabel">Drag Indicator: {dragIndicator}</Text>
            <Text color="secondaryLabel">
              Background Interaction: {backgroundInteractionEnabled ? 'enabled' : 'disabled'}
            </Text>
            <Text color="secondaryLabel">Dismiss: {dismissDisabled ? 'disabled' : 'enabled'}</Text>
            <Button label="Close" onPress={() => setShowConfigured(false)} />
          </VStack>
        </Group>
      </BottomSheet>

      {/* React Native Content Sheet */}
      <BottomSheet isPresented={showRNContent} onIsPresentedChange={setShowRNContent} fitToContents>
        <Group modifiers={[presentationDragIndicator('visible')]}>
          <RNHostView matchContents>
            <View style={{ padding: 24 }}>
              <RNText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                React Native Content
              </RNText>
              <RNText style={{ color: '#666', marginBottom: 16 }}>Counter: {counter}</RNText>
              <Pressable
                style={{
                  backgroundColor: '#007AFF',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
                onPress={() => setCounter(counter + 1)}>
                <RNText style={{ color: 'white', fontWeight: '600' }}>Increment</RNText>
              </Pressable>
              <Pressable
                style={{
                  backgroundColor: '#FF3B30',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => setShowRNContent(false)}>
                <RNText style={{ color: 'white', fontWeight: '600' }}>Close</RNText>
              </Pressable>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>

      {/* React Native Content Sheet with flex 1 children */}
      <BottomSheet
        isPresented={showRNContentWithFlex1}
        onIsPresentedChange={setShowRNContentWithFlex1}>
        <Group
          modifiers={[
            presentationDetents(['medium', 'large']),
            presentationDragIndicator('visible'),
          ]}>
          <RNHostView>
            <View style={{ flex: 1, backgroundColor: 'blue' }}>
              <RNText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                React Native Content
              </RNText>
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
