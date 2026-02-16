// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXDevMenu

struct DemoProject {
  static let displayName = "Learning Playground"

  static let snackDependencies: [String: [String: Any]] = [
    // All modules are preloaded in the snack runtime (version "*")
    "react-native-reanimated": ["version": "*"],
    "@expo/vector-icons": ["version": "*"],
    "react-native-gesture-handler": ["version": "*"],
    "react-native-safe-area-context": ["version": "*"],
    "@shopify/react-native-skia": ["version": "*"],
    "expo-video": ["version": "*"],
    "expo-linear-gradient": ["version": "*"],
    "expo-image": ["version": "*"],
    "expo-status-bar": ["version": "*"]
  ]

  static let snackFiles: [String: SnackSessionClient.SnackFile] = [
    "App.js": .init(path: "App.js", contents: appCode, isAsset: false),
    "shared.js": .init(path: "shared.js", contents: sharedCode, isAsset: false),
    "HomeScreen.js": .init(path: "HomeScreen.js", contents: homeScreenCode, isAsset: false),
    "DemoScreens.js": .init(path: "DemoScreens.js", contents: demoScreensCode, isAsset: false)
  ]
}

// MARK: - App.js

extension DemoProject {
  static let appCode = """
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemeProvider, useTheme, useThemeContext, ThemedText } from './shared';
import HomeScreen from './HomeScreen';
import {
  DemosIndex,
  ImageDemo,
  GradientDemo,
  VideoDemo,
  SkiaDemo,
  ReanimatedDemo,
} from './DemoScreens';

const demoScreens = {
  ImageDemo: { component: ImageDemo, title: 'Image' },
  GradientDemo: { component: GradientDemo, title: 'Gradient' },
  VideoDemo: { component: VideoDemo, title: 'Video' },
  SkiaDemo: { component: SkiaDemo, title: 'Skia' },
  ReanimatedDemo: { component: ReanimatedDemo, title: 'Animation' },
};

function TabBar({ activeTab, onTabPress }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const tabs = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'demos', icon: 'apps', label: 'Demos' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.background,
        paddingBottom: insets.bottom,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.backgroundElement,
      }}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => onTabPress(tab.key)}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
          <Ionicons
            name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline`}
            size={24}
            color={activeTab === tab.key ? '#3b82f6' : theme.textSecondary}
          />
          <Text
            style={{
              fontSize: 10,
              marginTop: 2,
              color: activeTab === tab.key ? '#3b82f6' : theme.textSecondary,
            }}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function EducationalPanel() {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: theme.backgroundElement,
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 16 + (bottom * 1.5),
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 8,
            backgroundColor: '#3b82f6',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Ionicons name="code-slash" size={20} color="white" />
        </View>
        <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>
          Tools menu
        </ThemedText>
      </View>
      <ThemedText
        themeColor="textSecondary"
        style={{ fontSize: 16, lineHeight: 21 }}>
        Press the blue gear icon to open the dev menu, then tap{' '}
        <ThemedText style={{ fontWeight: '600', fontSize: 16 }}>
          Source code explorer
        </ThemedText>
      </ThemedText>
    </View>
  );
}

function Header({ title, canGoBack, onBack }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.backgroundElement,
      }}>
      <View style={{ width: 32, height: 32, justifyContent: 'center' }}>
        {canGoBack && (
          <Pressable onPress={onBack} style={{ padding: 4, margin: -4 }}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
        )}
      </View>
      <ThemedText
        style={{
          fontSize: 17,
          fontWeight: '600',
          flex: 1,
          textAlign: 'center',
        }}>
        {title}
      </ThemedText>
      <View style={{ width: 32, height: 32 }} />
    </View>
  );
}

function DemosStack({ stack, setStack, goBack }) {
  const theme = useTheme();
  const currentScreen = stack[stack.length - 1];
  const canGoBack = stack.length > 1;
  const title =
    currentScreen === 'DemosIndex'
      ? 'Demos'
      : demoScreens[currentScreen]?.title ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Header
        title={title}
        canGoBack={canGoBack}
        onBack={() => setStack(stack.slice(0, -1))}
      />
      <View style={{ flex: 1 }}>
        {currentScreen === 'DemosIndex' ? (
          <DemosIndex
            goBack={goBack}
            navigation={{ navigate: (screen) => setStack([...stack, screen]) }}
          />
        ) : (
          <Animated.View
            key={currentScreen}
            entering={FadeIn.duration(200)}
            style={{ flex: 1 }}>
            {(() => {
              const Screen = demoScreens[currentScreen]?.component;
              return Screen ? <Screen /> : null;
            })()}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function AppContent() {
  const theme = useTheme();
  const { colorScheme } = useThemeContext();
  const [activeTab, setActiveTab] = useState('home');
  const [demosStack, setDemosStack] = useState(['DemosIndex']);

  const handleTabPress = (tab) => {
    if (tab === 'demos' && activeTab === 'demos') {
      setDemosStack(['DemosIndex']);
    }
    setActiveTab(tab);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: activeTab === 'home' ? 1 : 0,
              opacity: activeTab === 'home' ? 1 : 0,
            },
          ]}
          pointerEvents={activeTab === 'home' ? 'auto' : 'none'}>
          <HomeScreen navigateToDemos={() => handleTabPress('demos')} />
        </View>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: activeTab === 'demos' ? 1 : 0,
              opacity: activeTab === 'demos' ? 1 : 0,
            },
          ]}
          pointerEvents={activeTab === 'demos' ? 'auto' : 'none'}>
          <DemosStack
            stack={demosStack}
            setStack={setDemosStack}
            goBack={() => handleTabPress('home')}
          />
        </View>
      </View>

      <EducationalPanel />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
"""
}

// MARK: - shared.js

extension DemoProject {
  static let sharedCode = """
import { createContext, useContext, useState } from 'react';
import {
  Text,
  View,
  Pressable,
  useColorScheme as useSystemColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
};

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemColorScheme = useSystemColorScheme();
  const [override, setOverride] = useState(null);
  const colorScheme =
    override ?? (systemColorScheme === 'dark' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        toggleColorScheme: () =>
          setOverride(colorScheme === 'dark' ? 'light' : 'dark'),
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
}

export function useTheme() {
  return Colors[useThemeContext().colorScheme];
}

export function ThemedText({ style, themeColor, ...rest }) {
  const theme = useTheme();
  return (
    <Text
      style={[{ color: theme[themeColor ?? 'text'], fontSize: 16 }, style]}
      {...rest}
    />
  );
}

export function ThemedView({ style, type, ...rest }) {
  const theme = useTheme();
  return (
    <View
      style={[{ backgroundColor: theme[type ?? 'background'] }, style]}
      {...rest}
    />
  );
}

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useThemeContext();
  const theme = useTheme();

  return (
    <Pressable
      onPress={toggleColorScheme}
      style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}>
      <Ionicons
        name={colorScheme === 'dark' ? 'sunny' : 'moon'}
        size={24}
        color={theme.text}
      />
    </Pressable>
  );
}

export function Section({ title, children, centered }) {
  const theme = useTheme();
  return (
    <View
      style={{
        gap: Spacing.two,
        padding: Spacing.three,
        backgroundColor: theme.backgroundElement,
        borderRadius: 16,
      }}>
      <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
        {title}
      </ThemedText>
      {centered ? (
        <View style={{ alignItems: 'center' }}>{children}</View>
      ) : (
        children
      )}
    </View>
  );
}
"""
}

// MARK: - HomeScreen.js

extension DemoProject {
  static let homeScreenCode = """
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText, ThemedView, ThemeToggle, Spacing } from './shared';

export default function HomeScreen(props) {
  const insets = useSafeAreaInsets();
  const { navigateToDemos } = props;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <ThemeToggle />
        </View>
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#3c9ffe', '#0274df']}
            style={styles.iconGradient}>
            <Ionicons name="planet" size={64} color="white" />
          </LinearGradient>
          <ThemedText style={styles.title}>Learn with Expo</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Expo Go is a sandbox to learn, develop, and test JavaScript and
            web-based interactive experiences.
          </ThemedText>

          <TouchableOpacity
            onPress={navigateToDemos}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: '#3b82f6',
            }}>
            <Text
              style={{ fontWeight: 'semibold', fontSize: 16, color: '#fff' }}>
              Explore demos
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.four,
    maxWidth: 800,
  },
  header: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    marginTop: 20,
  },
  iconGradient: {
    width: 128,
    height: 128,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
"""
}

// MARK: - DemoScreens.js

extension DemoProject {
  static let demoScreensCode = """
import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  BlurMask,
  Canvas,
  Circle as SkiaCircle,
  Fill,
  Group,
  vec,
} from '@shopify/react-native-skia';

import { ThemedText, useTheme, Spacing, Section } from './shared';

const demos = [
  {
    name: 'Image',
    screen: 'ImageDemo',
    icon: 'image',
    description: 'Image loading and display',
  },
  {
    name: 'Gradient',
    screen: 'GradientDemo',
    icon: 'color-palette',
    description: 'Linear gradients with animation',
  },
  {
    name: 'Video',
    screen: 'VideoDemo',
    icon: 'play-circle',
    description: 'Video playback controls',
  },
  {
    name: 'Skia',
    screen: 'SkiaDemo',
    icon: 'pulse',
    description: 'GPU-accelerated 2D graphics',
  },
  {
    name: 'Animation',
    screen: 'ReanimatedDemo',
    icon: 'sync',
    description: 'Smooth flip card animation',
  },
];

// ============================================================
// Demos Index (List)
// ============================================================

function DemoRow({ item, index, onPress }) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: Spacing.three,
              gap: Spacing.three,
              backgroundColor: pressed
                ? theme.backgroundSelected
                : theme.backgroundElement,
              borderRadius: 12,
              borderCurve: 'continuous',
            }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                borderCurve: 'continuous',
                backgroundColor: theme.background,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={item.icon} size={22} color="#3b82f6" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={{ fontSize: 17, fontWeight: '600' }}>
                {item.name}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 14 }}>
                {item.description}
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={theme.textSecondary}
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function DemosIndex({ navigation, goBack }) {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}>
      {demos.map((item, index) => (
        <DemoRow
          key={item.name}
          item={item}
          index={index}
          onPress={() => navigation.navigate(item.screen)}
        />
      ))}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 16,
        }}>
        <TouchableOpacity
          onPress={goBack}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: '#3b82f6',
          }}>
          <Text style={{ fontWeight: 'semibold', fontSize: 16, color: '#fff' }}>
            Back to information
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const SAMPLE_IMAGES = [
  'https://picsum.photos/seed/expo1/400/300',
  'https://picsum.photos/seed/expo2/400/300',
  'https://picsum.photos/seed/expo3/400/300',
];

function ImageSection({ title, children }) {
  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText
        style={{ fontSize: 14, fontWeight: '600', textTransform: 'uppercase' }}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

export function ImageDemo() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.three, gap: Spacing.four }}>
      <ImageSection title="Basic Image">
        <Image
          source={{ uri: SAMPLE_IMAGES[0] }}
          style={{ width: '100%', height: 200, borderRadius: 12 }}
          contentFit="cover"
          transition={300}
        />
      </ImageSection>

      <ImageSection title="Content Fit Modes">
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          {['cover', 'contain', 'fill'].map((fit) => (
            <View key={fit} style={{ flex: 1, gap: Spacing.one }}>
              <Image
                source={{ uri: SAMPLE_IMAGES[1] }}
                style={{
                  width: '100%',
                  height: 100,
                  borderRadius: 8,
                  backgroundColor: theme.backgroundElement,
                }}
                contentFit={fit}
                transition={300}
              />
              <ThemedText
                themeColor="textSecondary"
                style={{ fontSize: 12, textAlign: 'center' }}>
                {fit}
              </ThemedText>
            </View>
          ))}
        </View>
      </ImageSection>

      <ImageSection title="Image Background">
        <ImageBackground
          source={{ uri: SAMPLE_IMAGES[2] }}
          style={{
            height: 180,
            borderRadius: 12,
            overflow: 'hidden',
            justifyContent: 'flex-end',
          }}
          contentFit="cover">
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: Spacing.three,
            }}>
            <ThemedText
              style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>
              Overlay Content
            </ThemedText>
            <ThemedText
              style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              Text rendered on top of image
            </ThemedText>
          </View>
        </ImageBackground>
      </ImageSection>

      <ImageSection title="Blurhash Placeholder">
        <Image
          source={{ uri: 'https://picsum.photos/seed/expo4/400/200' }}
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          style={{ width: '100%', height: 150, borderRadius: 12 }}
          contentFit="cover"
          transition={500}
        />
      </ImageSection>
    </ScrollView>
  );
}

function incrementColor(color, step) {
  const intColor = parseInt(color.substring(1), 16);
  const newIntColor = ((intColor + step) % 0xffffff).toString(16);
  return `#${'0'.repeat(6 - newIntColor.length)}${newIntColor}`;
}

function AnimatedColors() {
  const [colorTop, setColorTop] = useState('#3b82f6');
  const [colorBottom, setColorBottom] = useState('#8b5cf6');

  useEffect(() => {
    const interval = setInterval(() => {
      setColorTop((c) => incrementColor(c, 256));
      setColorBottom((c) => incrementColor(c, -256));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient
      colors={[colorTop, colorBottom]}
      style={{ height: 120, borderRadius: 12, borderCurve: 'continuous' }}
    />
  );
}

function AnimatedPosition() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCount((c) => c + 1), 50);
    return () => clearInterval(interval);
  }, []);

  const position = Math.abs(Math.sin(count / 50));

  return (
    <View style={{ gap: Spacing.one }}>
      <LinearGradient
        colors={['#3b82f6', '#10b981']}
        start={{ x: position, y: 0 }}
        end={{ x: 1 - position, y: 1 }}
        style={{ height: 120, borderRadius: 12, borderCurve: 'continuous' }}
      />
      <ThemedText
        themeColor="textSecondary"
        style={{ fontSize: 12, fontVariant: ['tabular-nums'] }}>
        start: [{position.toFixed(2)}, 0] end: [{(1 - position).toFixed(2)}, 1]
      </ThemedText>
    </View>
  );
}

export function GradientDemo() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}>
      <Section title="Animated Colors">
        <AnimatedColors />
      </Section>

      <Section title="Animated Direction">
        <AnimatedPosition />
      </Section>

      <Section title="Color Stops">
        <LinearGradient
          colors={[
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#3b82f6',
            '#8b5cf6',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 60, borderRadius: 12, borderCurve: 'continuous' }}
        />
        <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
          Rainbow gradient with 6 color stops
        </ThemedText>
      </Section>

      <Section title="Diagonal Gradient">
        <LinearGradient
          colors={['#1e3a8a', '#7c3aed', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 120, borderRadius: 12, borderCurve: 'continuous' }}
        />
      </Section>

      <Section title="Custom Locations">
        <LinearGradient
          colors={['#0ea5e9', '#0ea5e9', '#f43f5e', '#f43f5e']}
          locations={[0, 0.5, 0.5, 1]}
          style={{ height: 80, borderRadius: 12, borderCurve: 'continuous' }}
        />
        <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
          Sharp color transition at 50%
        </ThemedText>
      </Section>
    </ScrollView>
  );
}

const VIDEO_SOURCE = {
  uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
};

function ControlButton({ title, onPress, active }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.three,
        backgroundColor: active ? '#3b82f6' : theme.backgroundElement,
        borderRadius: 8,
        borderCurve: 'continuous',
        opacity: pressed ? 0.7 : 1,
      })}>
      <ThemedText
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: active ? 'white' : theme.text,
        }}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

function ControlRow({ label, children }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.two,
      }}>
      <ThemedText themeColor="textSecondary" style={{ fontSize: 14 }}>
        {label}
      </ThemedText>
      <View style={{ flexDirection: 'row', gap: Spacing.two }}>{children}</View>
    </View>
  );
}

export function VideoDemo() {
  const theme = useTheme();
  const [loop, setLoop] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  const player = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = true;
    p.play();
  });

  const togglePlayPause = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
  }, [player]);

  const seekBackward = useCallback(() => {
    player.seekBy(-10);
  }, [player]);

  const seekForward = useCallback(() => {
    player.seekBy(10);
  }, [player]);

  const replay = useCallback(() => {
    player.replay();
  }, [player]);

  const updateLoop = useCallback(
    (value) => {
      player.loop = value;
      setLoop(value);
    },
    [player]
  );

  const updatePlaybackRate = useCallback(
    (rate) => {
      player.playbackRate = rate;
      setPlaybackRate(rate);
    },
    [player]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ gap: Spacing.three }}>
      <VideoView
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        player={player}
      />

      <View style={{ padding: Spacing.three, gap: Spacing.three }}>
        <View
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 16,
            borderCurve: 'continuous',
            padding: Spacing.three,
            gap: Spacing.one,
          }}>
          <ThemedText
            style={{
              fontSize: 14,
              fontWeight: '600',
              marginBottom: Spacing.one,
            }}>
            Playback Controls
          </ThemedText>

          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.two,
              flexWrap: 'wrap',
            }}>
            <ControlButton title="Play/Pause" onPress={togglePlayPause} />
            <ControlButton title="-10s" onPress={seekBackward} />
            <ControlButton title="+10s" onPress={seekForward} />
            <ControlButton title="Replay" onPress={replay} />
            <ControlButton title="Mute" onPress={toggleMute} />
          </View>
        </View>

        <View
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 16,
            borderCurve: 'continuous',
            padding: Spacing.three,
          }}>
          <ThemedText
            style={{
              fontSize: 14,
              fontWeight: '600',
              marginBottom: Spacing.one,
            }}>
            Playback Speed
          </ThemedText>

          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            {[0.5, 1, 1.5, 2].map((rate) => (
              <ControlButton
                key={rate}
                title={`${rate}x`}
                onPress={() => updatePlaybackRate(rate)}
                active={playbackRate === rate}
              />
            ))}
          </View>
        </View>

        <View
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 16,
            borderCurve: 'continuous',
            padding: Spacing.three,
          }}>
          <ThemedText
            style={{
              fontSize: 14,
              fontWeight: '600',
              marginBottom: Spacing.one,
            }}>
            Settings
          </ThemedText>

          <ControlRow label="Loop playback">
            <Switch value={loop} onValueChange={updateLoop} />
          </ControlRow>
        </View>

        <ThemedText
          themeColor="textSecondary"
          style={{ fontSize: 12, textAlign: 'center' }}
          selectable>
          Big Buck Bunny - Blender Foundation (CC)
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const SKIA_COLORS = [
  '#61bea2',
  '#529ca0',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
];

function BreatheAnimation() {
  const { width, height } = useWindowDimensions();
  const canvasHeight = Math.min(height * 0.4, 300);
  const centerX = width / 2;
  const centerY = canvasHeight / 2;
  const radius = Math.min(width, canvasHeight) / 4;

  return (
    <Canvas style={{ width, height: canvasHeight }}>
      <Fill color="rgb(36, 43, 56)" />
      <Group origin={vec(centerX, centerY)} blendMode="screen">
        <BlurMask style="solid" blur={20} />
        {SKIA_COLORS.map((color, index) => {
          const theta = (index * (2 * Math.PI)) / 6;
          const dist = radius * 0.7;
          const x = centerX + Math.cos(theta) * dist;
          const y = centerY + Math.sin(theta) * dist;
          return (
            <SkiaCircle
              key={index}
              cx={x}
              cy={y}
              r={radius * 0.8}
              color={color}
            />
          );
        })}
      </Group>
    </Canvas>
  );
}

export function SkiaDemo() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: Spacing.three }}>
      <BreatheAnimation />

      <View style={{ padding: Spacing.three, gap: Spacing.two }}>
        <View
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 16,
            borderCurve: 'continuous',
            padding: Spacing.three,
            gap: Spacing.two,
          }}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
            Skia Graphics
          </ThemedText>
          <ThemedText
            themeColor="textSecondary"
            style={{ fontSize: 14, lineHeight: 20 }}>
            This demo uses Skia for GPU-accelerated 2D graphics. Six circles
            with a blur effect and screen blend mode create a glowing pattern.
          </ThemedText>
        </View>

        <View
          style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 16,
            borderCurve: 'continuous',
            padding: Spacing.three,
            gap: Spacing.one,
          }}>
          <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
            Features Used
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
            • Canvas and Circle primitives
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
            • BlurMask for gaussian blur
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
            • Group for compositing
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
            • Screen blend mode
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

function FlipCard({
  isFlipped,
  direction = 'y',
  duration = 500,
  frontContent,
  backContent,
  cardStyle,
  onPress,
}) {
  const isDirectionX = direction === 'x';

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.value), [0, 1], [0, 180]);
    const rotateValue = withTiming(`${spinValue}deg`, { duration });
    return {
      transform: [
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
      ],
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.value), [0, 1], [180, 360]);
    const rotateValue = withTiming(`${spinValue}deg`, { duration });
    return {
      transform: [
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
      ],
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          { position: 'absolute', backfaceVisibility: 'hidden', zIndex: 1 },
          cardStyle,
          frontAnimatedStyle,
        ]}>
        {frontContent}
      </Animated.View>
      <Animated.View
        style={[
          { backfaceVisibility: 'hidden', zIndex: 2 },
          cardStyle,
          backAnimatedStyle,
        ]}>
        {backContent}
      </Animated.View>
    </Pressable>
  );
}

function CardContent({ emoji, text, backgroundColor }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        borderRadius: 20,
        borderCurve: 'continuous',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.three,
        paddingTop: Spacing.four,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
      }}>
      <ThemedText style={{ fontSize: 44 }}>{emoji}</ThemedText>
      <ThemedText
        style={{
          color: '#1a1a2e',
          fontWeight: '600',
          fontSize: 16,
          marginTop: Spacing.two,
        }}>
        {text}
      </ThemedText>
    </View>
  );
}

function FlipCardDemo() {
  const isFlippedY = useSharedValue(false);
  const isFlippedX = useSharedValue(false);

  return (
    <View style={{ gap: Spacing.four }}>
      <View style={{ alignItems: 'center', gap: Spacing.three }}>
        <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
          Horizontal Flip (Y-axis)
        </ThemedText>
        <FlipCard
          isFlipped={isFlippedY}
          direction="y"
          cardStyle={{ width: 180, height: 220 }}
          frontContent={
            <CardContent
              emoji={"🎨"}
              text="Tap to Flip"
              backgroundColor="#b6cff7"
            />
          }
          backContent={
            <CardContent
              emoji={"✨"}
              text="Back Side"
              backgroundColor="#baeee5"
            />
          }
          onPress={() => (isFlippedY.value = !isFlippedY.value)}
        />
      </View>

      <View style={{ alignItems: 'center', gap: Spacing.three }}>
        <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
          Vertical Flip (X-axis)
        </ThemedText>
        <FlipCard
          isFlipped={isFlippedX}
          direction="x"
          cardStyle={{ width: 180, height: 220 }}
          frontContent={
            <CardContent
              emoji={"🚀"}
              text="Tap to Flip"
              backgroundColor="#fecaca"
            />
          }
          backContent={
            <CardContent emoji={"🏯"} text="Flipped!" backgroundColor="#d9f99d" />
          }
          onPress={() => (isFlippedX.value = !isFlippedX.value)}
        />
      </View>
    </View>
  );
}

export function ReanimatedDemo() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: Spacing.three,
        paddingTop: Spacing.four,
        gap: Spacing.four,
      }}>
      <FlipCardDemo />

      <View
        style={{
          backgroundColor: theme.backgroundElement,
          borderRadius: 16,
          borderCurve: 'continuous',
          padding: Spacing.three,
          gap: Spacing.two,
        }}>
        <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
          Animations
        </ThemedText>
        <ThemedText
          themeColor="textSecondary"
          style={{ fontSize: 14, lineHeight: 20 }}>
          Smooth 60fps animations using shared values and the UI thread. The
          flip card demonstrates 3D transforms with backface visibility
          handling.
        </ThemedText>
      </View>

      <View
        style={{
          backgroundColor: theme.backgroundElement,
          borderRadius: 16,
          borderCurve: 'continuous',
          padding: Spacing.three,
          gap: Spacing.one,
        }}>
        <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>
          Techniques Used
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
          • useSharedValue for animation state
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
          • useAnimatedStyle for transform styles
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
          • interpolate for value mapping
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
          • withTiming for smooth transitions
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
          • backfaceVisibility for 3D effect
        </ThemedText>
      </View>
    </ScrollView>
  );
}
"""
}
