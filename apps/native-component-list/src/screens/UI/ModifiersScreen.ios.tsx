import { Host, Section, Text, Form, VStack, HStack } from '@expo/ui/swift-ui';
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
  rotationEffect,
  offset,
  foregroundColor,
  border,
  onTapGesture,
  onLongPressGesture,
  accessibilityLabel,
  aspectRatio,
  grayscale,
  colorInvert,
  clipShape,
  glassEffect,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';

export default function ModifiersScreen() {
  const [playSounds, setPlaySounds] = useState(true);

  return (
    <ScrollView>
      <Host matchContents useViewportSizeMeasurement>
        <Form>
          {/* New Modifier System Demo Section */}
          <Section title="SwiftUI Modifiers Demo">
            {/* Basic Appearance Modifiers */}
            <Text
              modifiers={[
                background('#FF6B6B'),
                cornerRadius(12),
                padding({ all: 16 }),
                shadow({ radius: 4, x: 0, y: 2, color: '#FF6B6B40' }),
                foregroundColor('#FFFFFF'),
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
                foregroundColor('#FFFFFF'),
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
                foregroundColor('#FFFFFF'),
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
                foregroundColor('#FFFFFF'),
                shadow({ radius: 3, y: 2 }),
              ]}>
              📐 2:1 Aspect ratio blue card
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
                foregroundColor('#FFFFFF'),
                border({ color: '#9B59B6', width: 1 }),
                accessibilityLabel('Complex styled card with multiple effects'),
                onTapGesture(() => alert('Complex card with multiple modifiers tapped!')),
              ]}>
              ✨ Complex: All effects combined!
            </Text>

            {/* Legacy + Modern Combination */}
            <Text
              testID="legacy-modern-combo"
              weight="bold"
              size={16}
              modifiers={[
                background('#16A085'),
                cornerRadius(12),
                padding({ all: 16 }),
                shadow({ radius: 4, y: 2 }),
                foregroundColor('#FFFFFF'),
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
                foregroundColor('#FFFFFF'),
                onTapGesture(() => setPlaySounds(!playSounds)),
              ]}>
              {playSounds ? '🔊 Sounds ON (tap to toggle)' : '🔇 Sounds OFF (tap to toggle)'}
            </Text>
          </Section>
        </Form>
      </Host>

      <Host style={{ height: 500 }}>
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
            <Text modifiers={[foregroundColor('#FFFFFF'), padding({ all: 8 })]}>H0V0</Text>
            <Text modifiers={[foregroundColor('#FFFFFF'), padding({ all: 8 })]}>H1V0</Text>
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
              <Text modifiers={[foregroundColor('#FFFFFF')]}>H0V1</Text>
              <Text modifiers={[foregroundColor('#FFFFFF')]}>H1V1</Text>
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
              foregroundColor('#FFFFFF'),
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
            <Text modifiers={[foregroundColor('#000000')]}>Hello world</Text>
          </HStack>
        </VStack>
      </Host>
    </ScrollView>
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
