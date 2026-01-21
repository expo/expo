import SegmentedControl from '@react-native-segmented-control/segmented-control';
import Checkbox from 'expo-checkbox';
import {
  GlassColorScheme,
  GlassStyle,
  GlassView,
  GlassContainer,
  isLiquidGlassAvailable,
  isGlassEffectAPIAvailable,
} from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, ScrollView, Text, View, Image, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Static color options for tinting
const colorOptions = [
  { name: 'None', value: undefined },
  { name: 'Red', value: 'rgba(255, 59, 48, 0.7)' },
  { name: 'Blue', value: 'rgba(0, 122, 255, 0.7)' },
  { name: 'Green', value: 'rgba(52, 199, 89, 0.7)' },
];

const glassStyles: GlassStyle[] = ['clear', 'regular'];
const colorSchemes: GlassColorScheme[] = ['auto', 'light', 'dark'];

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

export default function GlassViewScreen() {
  const [selectedStyle, setSelectedStyle] = React.useState<GlassStyle>('regular');
  const [colorScheme, setColorScheme] = React.useState<GlassColorScheme>('auto');
  const [isInteractive, setIsInteractive] = React.useState(false);
  const [tintColor, setTintColor] = React.useState<string | undefined>(undefined);
  const [spacing, setSpacing] = React.useState(20);

  const translateX = useSharedValue(100);
  const translateY = useSharedValue(100);
  const startPosition = useSharedValue({ x: 0, y: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startPosition.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = startPosition.value.x + event.translationX;
      translateY.value = startPosition.value.y + event.translationY;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    };
  });

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
      <Text style={styles.title}>Glass Effect View (iOS 26+)</Text>
      <Text style={styles.subtitle}>
        Liquid Glass Available: {isLiquidGlassAvailable() ? 'Yes' : 'No'}
      </Text>
      <Text style={styles.subtitle}>
        Glass Effect API Available: {isGlassEffectAPIAvailable() ? 'Yes' : 'No'}
      </Text>

      <View style={styles.backgroundContainer}>
        <Image
          style={styles.backgroundImage}
          source={{
            uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
          }}
        />
        <GestureDetector gesture={panGesture}>
          <AnimatedGlassView
            style={[styles.glassRect, animatedStyle]}
            glassEffectStyle={selectedStyle}
            colorScheme={colorScheme}
            tintColor={tintColor}
            isInteractive={isInteractive}
            // known issue: the `isInteractive` prop can only be set once on mount
            key={`${selectedStyle}-${isInteractive}`}
          />
        </GestureDetector>
      </View>

      <View style={styles.controlsSection}>
        <Text style={styles.sectionTitle}>Glass Effect Style</Text>
        <SegmentedControl
          values={glassStyles}
          selectedIndex={glassStyles.indexOf(selectedStyle)}
          onChange={(event) => {
            setSelectedStyle(event.nativeEvent.value as GlassStyle);
          }}
        />

        <Text style={styles.sectionTitle}>Color Scheme</Text>
        <SegmentedControl
          values={colorSchemes}
          selectedIndex={colorSchemes.indexOf(colorScheme)}
          onChange={(event) => {
            setColorScheme(event.nativeEvent.value as GlassColorScheme);
          }}
        />

        <Text style={styles.sectionTitle}>Interactive Mode</Text>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsInteractive(!isInteractive)}>
          <Checkbox value={isInteractive} onValueChange={setIsInteractive} color="#007AFF" />
          <Text style={styles.checkboxLabel}>Enable Interactive Mode</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Tint Color</Text>
        <View style={styles.colorContainer}>
          {colorOptions.map((color) => (
            <TouchableOpacity
              key={color.name}
              style={[
                styles.colorButton,
                { backgroundColor: color.value || '#f0f0f0' },
                tintColor === color.value && styles.selectedColorButton,
              ]}
              onPress={() => setTintColor(color.value)}>
              {tintColor === color.value && <View style={styles.checkmark} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.title}>Glass Container (iOS 26+)</Text>

        <View style={styles.backgroundContainer}>
          <Image
            style={styles.backgroundImage}
            source={{
              uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
            }}
          />
          <GlassContainer spacing={spacing} style={styles.containerStyle}>
            <GlassView
              style={styles.smallGlass1}
              glassEffectStyle={selectedStyle}
              colorScheme={colorScheme}
              tintColor={tintColor}
            />
            <GlassView
              style={styles.smallGlass2}
              glassEffectStyle={selectedStyle}
              colorScheme={colorScheme}
              tintColor={tintColor}
            />
            <GlassView
              style={styles.smallGlass3}
              glassEffectStyle={selectedStyle}
              colorScheme={colorScheme}
              tintColor={tintColor}
            />
          </GlassContainer>
        </View>

        <Text style={styles.sectionTitle}>Container Spacing</Text>
        <SegmentedControl
          values={['10', '20', '40', '80']}
          selectedIndex={[10, 20, 40, 80].indexOf(spacing)}
          onChange={(event) => {
            setSpacing(parseInt(event.nativeEvent.value, 10));
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  backgroundContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundText: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    borderRadius: 8,
  },
  glassRect: {
    position: 'absolute',
    width: 150,
    height: 100,
    borderRadius: 12,
    borderTopLeftRadius: 100,
  },
  glassContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  glassLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  glassSubLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  controlsSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxContainer: {
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
    textTransform: 'capitalize',
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorButton: {
    borderColor: '#000',
    borderWidth: 3,
  },
  noneText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  fallbackText: {
    fontSize: 14,
    color: '#ff6b35',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scrollViewContent: {
    gap: 16,
  },
  containerStyle: {
    position: 'absolute',
    top: 50,
    left: 50,
    width: 200,
    height: 150,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallGlass1: {
    width: 60,
    height: 60,
    borderRadius: 100,
  },
  smallGlass2: {
    width: 50,
    height: 50,
    borderRadius: 100,
  },
  smallGlass3: {
    width: 40,
    height: 40,
    borderRadius: 100,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
