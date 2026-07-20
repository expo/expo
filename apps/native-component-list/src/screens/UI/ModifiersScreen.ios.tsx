import {
  Button,
  DisclosureGroup,
  Host,
  Section,
  Text,
  Form,
  VStack,
  HStack,
  ColorPicker,
  Picker,
  Toggle,
  Rectangle,
  Slider,
  Capsule,
  Stepper,
  Spacer,
  Image,
} from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  shadow,
  padding,
  frame,
  opacity,
  blur,
  brightness,
  saturation,
  scaleEffect,
  containerRelativeFrame,
  rotationEffect,
  offset,
  listRowSeparator,
  listRowSpacing,
  border,
  strokeBorder,
  onTapGesture,
  onLongPressGesture,
  onAppear,
  onDisappear,
  onGeometryChange,
  accessibilityLabel,
  accessibilityIdentifier,
  accessibilityHidden,
  accessibilityInputLabels,
  accessibilityElement,
  accessibilityAddTraits,
  accessibilityRemoveTraits,
  aspectRatio,
  grayscale,
  colorInvert,
  clipShape,
  glassEffect,
  foregroundStyle,
  fixedSize,
  disabled,
  scrollContentBackground,
  listRowBackground,
  allowsTightening,
  truncationMode,
  kerning,
  monospacedDigit,
  textCase,
  underline,
  strikethrough,
  multilineTextAlignment,
  textSelection,
  lineSpacing,
  listRowInsets,
  badge,
  badgeProminence,
  listSectionMargins,
  pickerStyle,
  tag,
  font,
  dynamicTypeSize,
  imageScale,
  lineLimit,
  contentShape,
  shapes,
  resizable,
  tint,
  redacted,
  unredacted,
  privacySensitive,
  buttonStyle,
} from '@expo/ui/swift-ui/modifiers';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAssets } from 'expo-asset';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ModifiersScreenProps = {
  navigation: NativeStackNavigationProp<{ 'Searchable modifier': undefined }>;
};

export default function ModifiersScreen({ navigation }: ModifiersScreenProps) {
  const [playSounds, setPlaySounds] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const dimensions = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const [color, setColor] = useState<string | null>('blue');

  const [hideScrollBackground, setHideScrollBackground] = useState(false);

  const [rowColor, setRowColor] = useState<string>('white');
  const [backgroundFormColor, setBackgroundFormColor] = useState<string>('#EAEAEAFF');

  const truncationModeOptions = ['head', 'middle', 'tail'];
  const [truncationModeIndex, setTruncationMode] = useState(0);

  const [allowTightening, setAllowsTightening] = useState(false);

  const [kerningValue, setKerning] = useState(0);
  const [redactLoading, setRedactLoading] = useState(true);
  const [redactPrivacy, setRedactPrivacy] = useState(true);

  const multilineTextAlignmentOptions = ['center', 'leading', 'trailing'];
  const [multilineTextAlignmentIndex, setMultilineTextAlignment] = useState(0);

  const [enabledSelection, setEnabledSelection] = useState(false);

  const [lineSpacingValue, setLineSpaceingValue] = useState(0);
  const [listRowSpacingValue, setListRowSpacingValue] = useState(0);

  const [enableRowInsets, setEnableRowInsets] = useState({
    top: false,
    leading: false,
    bottom: false,
    trailing: false,
    enabled: false,
  });
  const insets = [
    { key: 'top', label: 'Top' },
    { key: 'leading', label: 'Left' },
    { key: 'trailing', label: 'Right' },
    { key: 'bottom', label: 'Bottom' },
  ];

  const badgeType = ['standard', 'increased', 'decreased'] as const;
  const [badgeIndex, setBadgeIndex] = useState(0);

  const [containerRelativeFrameCount, setContainerRelativeFrameCount] = useState(1);
  const [contentShapeButtonCounter, setcontentShapeButtonCounter] = useState(0);
  const [assets] = useAssets([require('../../../assets/images/logo-wordmark.png')]);
  const wordmarkUri = assets?.[0]?.localUri;

  return (
    <ScrollView>
      <Host
        matchContents
        modifiers={[tint('#FF6B6B'), font({ size: 16, weight: 'medium', design: 'rounded' })]}>
        <Form
          modifiers={[
            scrollContentBackground(hideScrollBackground ? 'hidden' : 'visible'),
            listRowSpacing(listRowSpacingValue),
            background(backgroundFormColor),
            frame({
              height: dimensions.height - safeAreaInsets.top - safeAreaInsets.bottom,
              width: dimensions.width,
            }),
          ]}>
          <Section title="Modifier examples">
            <Button
              onPress={() => navigation.navigate('Searchable modifier')}
              modifiers={[buttonStyle('plain')]}>
              <HStack>
                <Text>Searchable</Text>
                <Spacer />
                <Image systemName="chevron.right" size={14} color="#8E8E93" />
              </HStack>
            </Button>
          </Section>

          {/* Badge modifiers */}
          <Section title="Badge modifier">
            <Text modifiers={[badge(''), badgeProminence(badgeType[badgeIndex])]}>Badge empty</Text>
            <Text modifiers={[badge('Hello'), badgeProminence(badgeType[badgeIndex])]}>Badge</Text>
            <Picker
              label="Select dabge type"
              modifiers={[pickerStyle('menu')]}
              selection={badgeIndex}
              onSelectionChange={setBadgeIndex}>
              {badgeType.map((type, index) => (
                <Text key={index} modifiers={[tag(index)]}>
                  {type}
                </Text>
              ))}
            </Picker>
          </Section>

          {/* List modifiers */}
          <Section
            title="Section with margin of length 30"
            modifiers={[listSectionMargins({ edges: 'horizontal', length: 40 })]}>
            <HStack
              modifiers={[
                frame({ width: 300, height: 100 }),
                background('#4facfe'),
                cornerRadius(20),
                padding({ all: 8 }),
                shadow({ radius: 8, x: 0, y: 4, color: '#4facfe40' }),
              ]}>
              <View style={[styles.uiView, { width: 280, height: 80 }]}>
                <RNText style={styles.uiViewText}>Any text</RNText>
              </View>
            </HStack>
            <Text>Only IOS 26</Text>
          </Section>

          <VStack
            spacing={30}
            modifiers={[
              ...(enableRowInsets.enabled
                ? [
                    listRowInsets({
                      top: enableRowInsets.top ? 30 : 20,
                      leading: enableRowInsets.leading ? 30 : 20,
                      bottom: enableRowInsets.bottom ? 30 : 20,
                      trailing: enableRowInsets.trailing ? 30 : 20,
                    }),
                  ]
                : []),
            ]}>
            <VStack spacing={20}>
              <Toggle
                label="Enable Insets"
                isOn={enableRowInsets.enabled}
                onIsOnChange={(v) => setEnableRowInsets((prev) => ({ ...prev, enabled: v }))}
              />
              <HStack spacing={20}>
                {[
                  ['top', 'leading'],
                  ['trailing', 'bottom'],
                ].map((group, i) => (
                  <VStack key={i} spacing={20}>
                    {group.map((key) => (
                      <Toggle
                        key={key}
                        label={insets.find((inset) => inset.key === key)!.label}
                        isOn={enableRowInsets[key as keyof typeof enableRowInsets]}
                        onIsOnChange={(v) => setEnableRowInsets((prev) => ({ ...prev, [key]: v }))}
                        modifiers={[disabled(!enableRowInsets.enabled)]}
                      />
                    ))}
                  </VStack>
                ))}
              </HStack>
            </VStack>
          </VStack>

          <Section title="List row separator">
            <Text>Default separator</Text>
            <Text>Default separator</Text>
            <Text modifiers={[listRowSeparator('hidden')]}>Hidden separator</Text>
          </Section>

          <Section title="List row spacing">
            <Text>Spacing row one</Text>
            <Text>Spacing row two</Text>
            <Text>Spacing row three</Text>
            <Slider
              min={0}
              max={30}
              value={listRowSpacingValue}
              onValueChange={setListRowSpacingValue}
            />
          </Section>

          {/* Text modifiers */}
          <Section title="Text modifier">
            <Text
              modifiers={[
                foregroundStyle({ type: 'color', color: color ?? 'primary' }),
                lineLimit(1),
                font({ size: 16 }),
                allowsTightening(allowTightening),
                truncationMode(
                  truncationModeOptions[truncationModeIndex] as 'head' | 'middle' | 'tail'
                ),
                frame({ width: 160, height: 50, alignment: 'leading' }),
              ]}>
              This is a wide text element
            </Text>
            <Picker
              label="Select mode"
              modifiers={[pickerStyle('menu')]}
              selection={truncationModeIndex}
              onSelectionChange={setTruncationMode}>
              {truncationModeOptions.map((option, index) => (
                <Text key={index} modifiers={[tag(index)]}>
                  {option}
                </Text>
              ))}
            </Picker>
            <Toggle
              label="Allow Tightening"
              isOn={allowTightening}
              onIsOnChange={setAllowsTightening}
            />
            <Text modifiers={[font({ size: 14 }), kerning(kerningValue)]}>Kerning Text</Text>
            <Slider min={0} max={10} onValueChange={setKerning} />

            <HStack alignment="center" spacing={40}>
              <VStack spacing={4}>
                <Text modifiers={[font({ size: 12 })]}>Default</Text>
                <Text modifiers={[font({ size: 20 })]}>1111111111</Text>
                <Text modifiers={[font({ size: 20 })]}>0000000000</Text>
              </VStack>
              <VStack spacing={4}>
                <Text modifiers={[font({ size: 12 })]}>monospacedDigit</Text>
                <Text modifiers={[font({ size: 20 }), monospacedDigit()]}>1111111111</Text>
                <Text modifiers={[font({ size: 20 }), monospacedDigit()]}>0000000000</Text>
              </VStack>
            </HStack>

            {/* Dynamic Type */}
            <VStack alignment="leading" spacing={8}>
              <Text modifiers={[font({ size: 12 })]}>
                Dynamic Type (try Settings &gt; Accessibility &gt; Larger Text)
              </Text>
              <Text modifiers={[font({ textStyle: 'largeTitle', weight: 'bold' })]}>
                largeTitle scales
              </Text>
              <Text modifiers={[font({ textStyle: 'body' })]}>body scales</Text>
              <Text modifiers={[font({ textStyle: 'caption' })]}>caption scales</Text>
            </VStack>

            {/* font on concatenated Text runs scales + keeps weight */}
            <Text>
              <Text modifiers={[font({ textStyle: 'largeTitle', weight: 'bold' })]}>Big </Text>
              <Text modifiers={[font({ textStyle: 'caption' })]}>and small, both scale</Text>
            </Text>

            {/* dynamicTypeSize: clamp how far Dynamic Type scales */}
            <VStack alignment="leading" spacing={8}>
              <Text modifiers={[font({ size: 12 })]}>dynamicTypeSize clamp</Text>
              <Text modifiers={[font({ textStyle: 'body' })]}>body, unbounded</Text>
              <Text modifiers={[font({ textStyle: 'body' }), dynamicTypeSize({ max: 'large' })]}>
                body, capped at large
              </Text>
              <Text modifiers={[font({ textStyle: 'body' }), dynamicTypeSize('xSmall')]}>
                body, fixed at xSmall
              </Text>
            </VStack>

            <HStack spacing={20}>
              <Text modifiers={[font({ size: 14 }), textCase('lowercase')]}>lowercase</Text>
              <Text modifiers={[font({ size: 14 }), textCase('uppercase')]}>uppercase</Text>
            </HStack>

            <HStack alignment="center" spacing={80}>
              <VStack spacing={15}>
                <Text modifiers={[font({ size: 16 })]}>Underline text</Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    underline({ isActive: true, pattern: 'solid', color: 'red' }),
                  ]}>
                  Text 1
                </Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    underline({ isActive: true, pattern: 'dash', color: 'green' }),
                  ]}>
                  Text 2
                </Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    underline({ isActive: true, pattern: 'dot', color: 'blue' }),
                  ]}>
                  Text 3
                </Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    underline({ isActive: true, pattern: 'dashDot' }),
                  ]}>
                  Text 4
                </Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    underline({ isActive: true, pattern: 'dashDotDot', color: 'pink' }),
                  ]}>
                  Text 5
                </Text>
              </VStack>
              <VStack spacing={15}>
                <Text modifiers={[font({ size: 16 })]}>Strikethrough text</Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    strikethrough({ isActive: true, pattern: 'solid', color: 'red' }),
                  ]}>
                  Text 1
                </Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    strikethrough({ isActive: true, pattern: 'dot', color: 'green' }),
                  ]}>
                  Text 2
                </Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    strikethrough({ isActive: true, pattern: 'dash', color: 'blue' }),
                  ]}>
                  Text 3
                </Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    strikethrough({ isActive: true, pattern: 'dashDot' }),
                  ]}>
                  Text 4
                </Text>
                <Text
                  modifiers={[
                    font({ size: 14 }),
                    strikethrough({ isActive: true, pattern: 'dashDotDot', color: 'pink' }),
                  ]}>
                  Text 5
                </Text>
              </VStack>
            </HStack>

            <VStack spacing={15}>
              <Text modifiers={[font({ size: 16 })]}>Stroke borders</Text>
              <HStack spacing={12}>
                <Text
                  modifiers={[
                    font({ size: 12 }),
                    padding({ all: 8 }),
                    strokeBorder({ color: '#45B7B8', style: { lineWidth: 2 } }),
                  ]}>
                  solid
                </Text>
                <Text
                  modifiers={[
                    font({ size: 12 }),
                    padding({ all: 8 }),
                    strokeBorder({ color: '#3498DB', style: { lineWidth: 2, dash: [6, 3] } }),
                  ]}>
                  dash
                </Text>
                <Text
                  modifiers={[
                    font({ size: 12 }),
                    padding({ all: 8 }),
                    strokeBorder({
                      color: '#16A085',
                      style: { lineWidth: 2, dash: [0.5, 4], lineCap: 'round' },
                    }),
                  ]}>
                  dot
                </Text>
                <Text
                  modifiers={[
                    font({ size: 12 }),
                    padding({ all: 8 }),
                    strokeBorder({
                      color: '#9B59B6',
                      style: { lineWidth: 2, dash: [6, 3] },
                      shape: 'roundedRectangle',
                      cornerRadius: 10,
                    }),
                  ]}>
                  rounded
                </Text>
              </HStack>
            </VStack>

            <VStack spacing={15}>
              <Picker
                label="Select alignment"
                modifiers={[pickerStyle('menu')]}
                selection={multilineTextAlignmentIndex}
                onSelectionChange={setMultilineTextAlignment}>
                {multilineTextAlignmentOptions.map((option, index) => (
                  <Text key={index} modifiers={[tag(index)]}>
                    {option}
                  </Text>
                ))}
              </Picker>
              <Text
                modifiers={[
                  font({ size: 14 }),
                  multilineTextAlignment(
                    multilineTextAlignmentOptions[multilineTextAlignmentIndex] as
                      | 'center'
                      | 'leading'
                      | 'trailing'
                  ),
                ]}>
                {`This is a block of text that shows up in a text element as multiple lines.\nHere we have chosen to center this text.`}
              </Text>
            </VStack>

            <VStack spacing={25}>
              <Toggle
                label="Enable selection"
                isOn={enabledSelection}
                onIsOnChange={setEnabledSelection}
              />
              <Text
                modifiers={[
                  foregroundStyle({ type: 'color', color: enabledSelection ? 'black' : 'gray' }),
                  font({ size: 14 }),
                  textSelection(enabledSelection),
                ]}>
                This is selected text
              </Text>
            </VStack>

            <HStack spacing={30}>
              <VStack alignment="center">
                <Text modifiers={[font({ size: 14 })]}>Default</Text>
                <Text modifiers={[font({ size: 12 }), frame({ width: 150, height: 120 })]}>
                  This is a string with default spacing between the bottom of one line and the top
                  of the next.
                </Text>
              </VStack>
              <VStack alignment="center">
                <Text modifiers={[font({ size: 14 })]}>Spacing</Text>
                <Text
                  modifiers={[
                    font({ size: 12 }),
                    frame({ width: 150, height: 120 }),
                    lineSpacing(lineSpacingValue),
                  ]}>
                  This is a string with 20 point spacing between the bottom of one line and the top
                  of the next.
                </Text>
              </VStack>
            </HStack>
            <Slider min={0} max={20} onValueChange={setLineSpaceingValue} />
          </Section>
          {/* Image modifiers */}
          <Section title="Image modifier">
            <VStack alignment="leading" spacing={8}>
              <Text modifiers={[font({ size: 12 })]}>
                font text style on a symbol scales with Dynamic Type
              </Text>
              <HStack alignment="center" spacing={16}>
                <Image systemName="bell.fill" />
                <Image systemName="bell.fill" modifiers={[font({ textStyle: 'largeTitle' })]} />
                <Image systemName="bell.fill" modifiers={[font({ textStyle: 'caption' })]} />
              </HStack>
            </VStack>
            <VStack alignment="leading" spacing={8}>
              <Text modifiers={[font({ size: 12 })]}>resizable symbol scales to its frame</Text>
              <HStack alignment="center" spacing={16}>
                <Image systemName="star.fill" size={24} />
                <Image
                  systemName="star.fill"
                  modifiers={[resizable(), frame({ width: 64, height: 64 })]}
                />
              </HStack>
            </VStack>
          </Section>
          {/* Image scale */}
          <Section title="Image scale">
            <VStack alignment="leading" spacing={8}>
              <HStack alignment="center" spacing={8} modifiers={[imageScale('small')]}>
                <Image systemName="star.fill" />
                <Text modifiers={[font({ textStyle: 'body' })]}>small</Text>
              </HStack>
              <HStack alignment="center" spacing={8} modifiers={[imageScale('medium')]}>
                <Image systemName="star.fill" />
                <Text modifiers={[font({ textStyle: 'body' })]}>medium</Text>
              </HStack>
              <HStack alignment="center" spacing={8} modifiers={[imageScale('large')]}>
                <Image systemName="star.fill" />
                <Text modifiers={[font({ textStyle: 'body' })]}>large</Text>
              </HStack>
            </VStack>
          </Section>
          <Section title="Redacted">
            <VStack alignment="leading" spacing={12}>
              <Toggle
                label="Simulate loading"
                isOn={redactLoading}
                onIsOnChange={setRedactLoading}
              />
              <VStack
                alignment="leading"
                spacing={6}
                modifiers={redactLoading ? [redacted('placeholder')] : undefined}>
                <Text modifiers={[font({ textStyle: 'headline' })]}>Jane Appleseed</Text>
                <Text modifiers={[font({ textStyle: 'subheadline' })]}>
                  Product Designer · San Francisco
                </Text>
                <Text modifiers={[font({ textStyle: 'body' })]}>
                  Building delightful native experiences.
                </Text>
              </VStack>
              <VStack
                alignment="leading"
                spacing={6}
                modifiers={redactLoading ? [redacted('placeholder')] : undefined}>
                <Text modifiers={[font({ textStyle: 'body' })]}>Profile details</Text>
                <Text modifiers={[font({ textStyle: 'footnote' }), unredacted()]}>
                  Loading… (unredacted, stays visible)
                </Text>
              </VStack>

              <Toggle
                label="Hide sensitive info"
                isOn={redactPrivacy}
                onIsOnChange={setRedactPrivacy}
              />
              <VStack
                alignment="leading"
                spacing={6}
                modifiers={redactPrivacy ? [redacted('privacy')] : undefined}>
                <Text modifiers={[font({ textStyle: 'subheadline' })]}>Account balance</Text>
                <Text modifiers={[font({ textStyle: 'title' }), privacySensitive()]}>
                  $12,480.55
                </Text>
                <Text modifiers={[font({ textStyle: 'footnote' })]}>
                  Only the balance is privacySensitive; the labels stay visible
                </Text>
              </VStack>
            </VStack>
          </Section>
          {/* Modifier usingscrollContentBackground and listRowBackground */}
          <Section title="Scroll Content Background Demo" modifiers={[listRowBackground(rowColor)]}>
            <Toggle
              isOn={hideScrollBackground}
              label="Hide form background"
              onIsOnChange={setHideScrollBackground}
            />
            <ColorPicker
              label="Select a row color"
              selection={rowColor}
              supportsOpacity
              onSelectionChange={setRowColor}
            />
            <ColorPicker
              label="Select a background color"
              selection={backgroundFormColor}
              supportsOpacity
              onSelectionChange={setBackgroundFormColor}
            />
          </Section>

          {/* Basic  Modifier using foregroundStyle */}

          <Section
            title="Foreground Style Modifier"
            modifiers={[
              foregroundStyle({
                type: 'linearGradient',
                colors: [
                  'deeppink',
                  'cyan',
                  'blue',
                  'burlywood',
                  'purple',
                  'cadetblue',
                  'pink',
                  'brown',
                ],
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 1, y: 1 },
              }),
            ]}>
            <Text
              modifiers={[
                foregroundStyle({ type: 'color', color: color ?? 'primary' }),
                font({ size: 12 }),
              ]}>
              Hello world, I don't react on foregroundStyle
            </Text>
            <ColorPicker
              label="Select a color"
              selection={color}
              onSelectionChange={setColor}
              // primary is a named color in SwiftUI
              modifiers={[foregroundStyle({ type: 'color', color: 'primary' })]}
            />
          </Section>

          {/* New Modifier System Demo Section */}
          <Section title="SwiftUI Modifiers Demo">
            {/* Basic Appearance Modifiers */}
            <Text
              modifiers={[
                background('#FF6B6B'),
                cornerRadius(12),
                padding({ all: 16 }),
                shadow({ radius: 4, x: 0, y: 2, color: '#FF6B6B40' }),
                foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                onTapGesture(() => console.log('Red card tapped!')),
              ]}>
              🔴 Tap me! Red card with shadow
            </Text>

            {/* Visual Effects */}
            <Text
              modifiers={[
                background('#4ECDC4'),
                cornerRadius(16),
                padding({ horizontal: 20, vertical: 12 }),
                blur(0.5),
                brightness(0.1),
                saturation(1.3),
                border({ color: '#45B7B8', width: 1 }),
                onLongPressGesture(() => console.log('Teal card long pressed!'), 1.0),
              ]}>
              🌊 Long press me! Teal with effects
            </Text>

            {/* Transform Modifiers */}
            <Text
              modifiers={[
                background('#9B59B6'),
                cornerRadius(8),
                padding({ all: 14 }),
                scaleEffect(1.05),
                rotationEffect(2),
                offset({ x: 10, y: 0 }),
                foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                shadow({ radius: 6, x: 2, y: 3, color: '#9B59B640' }),
              ]}>
              🎨 Scaled, rotated & offset purple
            </Text>

            {/* Grayscale Effect */}
            <Text
              modifiers={[
                background('#F39C12'),
                cornerRadius(10),
                padding({ all: 16 }),
                grayscale(1.0),
                opacity(0.8),
                border({ color: '#000000', width: 2 }),
              ]}>
              ⚫ Grayscale orange card
            </Text>

            {/* Color Invert Effect */}
            <Text
              modifiers={[
                background('#E74C3C'),
                cornerRadius(14),
                padding({ vertical: 18, horizontal: 24 }),
                colorInvert(true),
                shadow({ radius: 8, x: 0, y: 4 }),
              ]}>
              🔄 Color inverted card
            </Text>

            {/* Clipping and Masking */}
            <Text
              modifiers={[
                background('#1ABC9C'),
                padding({ all: 20 }),
                clipShape('circle'),
                foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                shadow({ radius: 10, x: 0, y: 5, color: '#1ABC9C30' }),
              ]}>
              ⭕ Circular clipped text
            </Text>

            {/* Aspect Ratio Demo */}
            <Text
              modifiers={[
                background('#3498DB'),
                cornerRadius(8),
                padding({ all: 12 }),
                aspectRatio({ ratio: 2.0, contentMode: 'fit' }),
                frame({ maxWidth: 280 }),
                foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                shadow({ radius: 3, y: 2 }),
              ]}>
              📐 2:1 Aspect ratio blue card
            </Text>

            {wordmarkUri && (
              <HStack spacing={16}>
                <VStack alignment="center" spacing={8}>
                  <Text modifiers={[font({ size: 12 })]}>Forced 1:1</Text>
                  <Image
                    uiImage={wordmarkUri}
                    modifiers={[
                      resizable(),
                      aspectRatio({ ratio: 1, contentMode: 'fit' }),
                      frame({ width: 140, height: 90 }),
                      background('#EAF4FF'),
                      border({ color: '#3498DB', width: 1 }),
                    ]}
                  />
                </VStack>

                <VStack alignment="center" spacing={8}>
                  <Text modifiers={[font({ size: 12 })]}>Intrinsic ratio</Text>
                  <Image
                    uiImage={wordmarkUri}
                    modifiers={[
                      resizable(),
                      aspectRatio({ contentMode: 'fit' }),
                      frame({ width: 140, height: 90 }),
                      background('#E8F8F5'),
                      border({ color: '#16A085', width: 1 }),
                    ]}
                  />
                </VStack>
              </HStack>
            )}

            {/* accessibilityHidden: decorative SF Symbol skipped by VoiceOver */}
            <HStack spacing={6}>
              <Image
                systemName="exclamationmark.triangle"
                size={17}
                modifiers={[accessibilityHidden(true)]}
              />
              <Text>Something went wrong</Text>
            </HStack>

            {/* accessibilityInputLabels: Voice Control can target this by spoken phrase */}
            <HStack spacing={6}>
              <Text
                modifiers={[
                  background('#1ABC9C'),
                  cornerRadius(8),
                  padding({ all: 8 }),
                  accessibilityInputLabels(['Hang up', 'End call']),
                ]}>
                End
              </Text>
            </HStack>

            {/* accessibilityElement: combine children into one VoiceOver element */}
            <HStack spacing={6} modifiers={[accessibilityElement('combine')]}>
              <Image systemName="star.fill" size={17} />
              <Text>4.8 out of 5 stars</Text>
            </HStack>

            {/* accessibilityAddTraits: VoiceOver announces this as both a button and a heading */}
            <HStack spacing={6}>
              <Text
                modifiers={[
                  background('#9B59B6'),
                  cornerRadius(8),
                  padding({ all: 8 }),
                  accessibilityAddTraits(['isButton', 'isHeader']),
                ]}>
                Filters
              </Text>
            </HStack>

            {/* accessibilityRemoveTraits: drop the redundant "image" trait from a labeled icon */}
            <HStack spacing={6}>
              <Image
                systemName="checkmark.seal.fill"
                size={17}
                modifiers={[accessibilityRemoveTraits(['isImage'])]}
              />
              <Text>Verified</Text>
            </HStack>

            <Text
              modifiers={[
                background('#E67E22'),
                cornerRadius(8),
                padding({ all: 12 }),
                fixedSize(),
                frame({ width: 100, height: 60 }),
                border({ color: '#D35400', width: 2 }),
                offset({ x: 100, y: 0 }),
                shadow({ radius: 3, y: 2 }),
              ]}>
              Text should break out of the 100px frame
            </Text>

            {/* Complex Combination */}
            <Text
              modifiers={[
                background('#8E44AD'),
                cornerRadius(18),
                padding({ all: 20 }),
                shadow({ radius: 12, x: 0, y: 6, color: '#8E44AD20' }),
                blur(0.3),
                brightness(0.05),
                saturation(1.4),
                scaleEffect(0.95),
                offset({ x: -5, y: 0 }),
                foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                border({ color: '#9B59B6', width: 1 }),
                accessibilityLabel('Complex styled card with multiple effects'),
                accessibilityIdentifier('complex-styled-card'),
                onTapGesture(() => alert('Complex card with multiple modifiers tapped!')),
              ]}>
              ✨ Complex: All effects combined!
            </Text>

            {/* Legacy + Modern Combination */}
            <Text
              testID="legacy-modern-combo"
              modifiers={[
                font({ size: 16, weight: 'bold' }),
                background('#16A085'),
                cornerRadius(12),
                padding({ all: 16 }),
                shadow({ radius: 4, y: 2 }),
                foregroundStyle({ type: 'color', color: '#FFFFFF' }),
              ]}>
              🔗 Legacy props + modern modifiers
            </Text>

            {/* Conditional Modifiers Demo */}
            <Text
              modifiers={[
                background(playSounds ? '#2ECC71' : '#95A5A6'),
                cornerRadius(10),
                padding({ all: 14 }),
                ...(playSounds
                  ? [shadow({ radius: 6, y: 3, color: '#2ECC7140' }), scaleEffect(1.02)]
                  : [grayscale(0.5), opacity(0.7)]),
                foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                onTapGesture(() => setPlaySounds(!playSounds)),
              ]}>
              {playSounds ? '🔊 Sounds ON (tap to toggle)' : '🔇 Sounds OFF (tap to toggle)'}
            </Text>

            {/* Disabled Modifier Demo */}
            <VStack spacing={8}>
              <Toggle
                isOn={!isDisabled}
                onIsOnChange={(value) => setIsDisabled(!value)}
                label="Enable Picker"
              />
              <Picker
                selection={1}
                onSelectionChange={(selection) => {
                  console.log('Picker option selected:', selection);
                }}
                modifiers={[
                  pickerStyle('segmented'),
                  disabled(isDisabled),
                  background(isDisabled ? '#BDC3C7' : '#3498DB'),
                  cornerRadius(8),
                  padding({ all: 4 }),
                  shadow({ radius: 2, y: 1, color: isDisabled ? '#BDC3C740' : '#3498DB40' }),
                ]}>
                {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option, index) => (
                  <Text key={index} modifiers={[tag(index)]}>
                    {option}
                  </Text>
                ))}
              </Picker>
            </VStack>
          </Section>

          {/* Container Relative Frame Modifier */}
          <Section title="Container Relative Frame Modifier">
            <Capsule
              modifiers={[
                containerRelativeFrame({
                  axes: 'horizontal',
                  count: containerRelativeFrameCount,
                  span: 1,
                }),
                foregroundStyle('#3498DB'),
              ]}
            />
            <HStack>
              {new Array(containerRelativeFrameCount).fill(null).map((_, i) => (
                <Capsule
                  key={i}
                  modifiers={[
                    containerRelativeFrame({
                      axes: 'horizontal',
                      count: containerRelativeFrameCount,
                      span: 1,
                    }),
                    foregroundStyle('#3498DB'),
                  ]}
                />
              ))}
            </HStack>
            <Stepper
              onValueChange={setContainerRelativeFrameCount}
              value={containerRelativeFrameCount}
              label={`Items count: ${containerRelativeFrameCount}`}
            />
          </Section>

          <AppearSection />

          <GeometrySection />

          {/* Container Shape Modifier */}
          <Section title="Content Shape Modifier">
            <Text>Try tapping the empty space between texts:</Text>
            <HStack
              modifiers={[
                cornerRadius(8),
                onTapGesture(() => {
                  Alert.alert('Without contentShape', 'Tapped! (Only works on text)');
                }),
              ]}>
              <Text>Left label</Text>
              <Spacer />
              <Text>Right label</Text>
            </HStack>

            <Text>{'WITH contentShape\nNow tap the empty space:'}</Text>
            <HStack
              spacing={0}
              modifiers={[
                contentShape(shapes.rectangle()),
                onTapGesture(() => {
                  setcontentShapeButtonCounter((prev) => {
                    const nextCount = prev + 1;
                    Alert.alert('With contentShape', `Works everywhere! Count: ${nextCount}`);
                    return nextCount;
                  });
                }),
              ]}>
              <Text>Left label</Text>
              <Spacer />
              <Text>Right label</Text>
            </HStack>
            <Text>Taps: {contentShapeButtonCounter}</Text>
          </Section>

          <Section title="Misc">
            <VStack
              spacing={20}
              modifiers={[
                frame({ height: 500 }),
                padding({ all: 16 }),
                background('#F8F9FA'),
                cornerRadius(16),
              ]}>
              {/* Styled HStack with modifiers */}
              <HStack
                spacing={20}
                modifiers={[
                  background('#667eea'),
                  cornerRadius(12),
                  padding({ all: 12 }),
                  shadow({ radius: 4, y: 2, color: '#667eea30' }),
                ]}>
                <Text
                  modifiers={[
                    foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                    padding({ all: 8 }),
                  ]}>
                  H0V0
                </Text>
                <Text
                  modifiers={[
                    foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                    padding({ all: 8 }),
                  ]}>
                  H1V0
                </Text>
              </HStack>

              {/* Nested styled layout */}
              <HStack modifiers={[padding({ horizontal: 10 })]}>
                <HStack
                  spacing={20}
                  modifiers={[
                    background('#f093fb'),
                    cornerRadius(10),
                    padding({ all: 10 }),
                    scaleEffect(0.95),
                    shadow({ radius: 3, y: 1 }),
                  ]}>
                  <Text modifiers={[foregroundStyle({ type: 'color', color: '#FFFFFF' })]}>
                    H0V1
                  </Text>
                  <Text modifiers={[foregroundStyle({ type: 'color', color: '#FFFFFF' })]}>
                    H1V1
                  </Text>
                </HStack>
              </HStack>

              {/* UIView with modifier styling around it */}
              <HStack
                modifiers={[
                  frame({ width: 300, height: 100 }),
                  background('#4facfe'),
                  cornerRadius(20),
                  padding({ all: 8 }),
                  shadow({ radius: 8, x: 0, y: 4, color: '#4facfe40' }),
                ]}>
                <View style={[styles.uiView, { width: 280, height: 80 }]}>
                  <RNText style={styles.uiViewText}>UIView in styled HStack</RNText>
                </View>
              </HStack>

              {/* Interactive modifier demo */}
              <Text
                modifiers={[
                  background('#ff9a9e'),
                  cornerRadius(25),
                  padding({ horizontal: 20, vertical: 12 }),
                  shadow({ radius: 5, y: 3 }),
                  foregroundStyle({ type: 'color', color: '#FFFFFF' }),
                  scaleEffect(1.05),
                  onTapGesture(() => alert('Layout section modifier demo!')),
                ]}>
                🚀 Tap this layout demo!
              </Text>
              <HStack
                modifiers={[
                  padding({ all: 16 }),
                  glassEffect({
                    glass: {
                      variant: 'regular',
                      interactive: true,
                    },
                  }),
                ]}>
                <Text modifiers={[foregroundStyle({ type: 'color', color: '#000000' })]}>
                  Hello world
                </Text>
              </HStack>
            </VStack>
          </Section>
        </Form>
      </Host>
    </ScrollView>
  );
}

function AppearSection() {
  const [appearCount, setAppearCount] = useState(0);
  const [disappearCount, setDisappearCount] = useState(0);
  const [disclosureGroupExpanded, setDisclosureGroupExpanded] = useState(false);

  return (
    <Section title={`Appear(${appearCount}) Disappear(${disappearCount})`}>
      <DisclosureGroup
        onIsExpandedChange={setDisclosureGroupExpanded}
        isExpanded={disclosureGroupExpanded}
        label="Show rectangle">
        <Rectangle
          modifiers={[
            foregroundStyle('#9B59B6'),
            cornerRadius(8),
            onAppear(() => setAppearCount((prev) => prev + 1)),
            onDisappear(() => setDisappearCount((prev) => prev + 1)),
          ]}
        />
      </DisclosureGroup>
    </Section>
  );
}

function GeometrySection() {
  const [frame, setFrame] = useState({ x: 0, y: 0, width: 0, height: 0 });
  return (
    <Section title="onGeometryChange (position + size)">
      <Text
        modifiers={[
          background('#5856D6'),
          cornerRadius(12),
          padding({ all: 16 }),
          foregroundStyle({ type: 'color', color: '#FFFFFF' }),
          onGeometryChange(setFrame),
        ]}>
        Track my frame
      </Text>
      <Text modifiers={[font({ size: 13 }), monospacedDigit()]}>
        {`global x: ${frame.x.toFixed(0)}  y: ${frame.y.toFixed(0)}  •  size ${frame.width.toFixed(
          0
        )} × ${frame.height.toFixed(0)} (pt)`}
      </Text>
    </Section>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  uiView: {
    backgroundColor: '#90EE90',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  uiViewText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

ModifiersScreen.navigationOptions = {
  title: 'Modifiers',
};
