import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  GestureDetector,
  Pressable as GestureHandlerPressable,
  RectButton,
  useTapGesture,
} from 'react-native-gesture-handler';

export type TouchCase = {
  name: string;
  render: (onInnerPress: () => void) => React.ReactElement;
};

// Content that the tappable rows host. Each row counts its own presses and the content's presses.
export const TOUCH_CASES: TouchCase[] = [
  { name: 'view', render: () => <View style={styles.square} /> },
  {
    name: 'pointer-events-none',
    render: () => <View pointerEvents="none" style={styles.square} />,
  },
  { name: 'text', render: () => <Text style={styles.icon}>›</Text> },
  {
    name: 'accessible-view',
    render: () => <View accessible accessibilityLabel="Icon" style={styles.square} />,
  },
  {
    name: 'image',
    render: () => (
      <Image source={require('../../../assets/images/example1.jpg')} style={styles.square} />
    ),
  },
  {
    name: 'gradient',
    render: () => <LinearGradient colors={['#4a90e2', '#9013fe']} style={styles.square} />,
  },
  {
    name: 'touch-handlers',
    // When the parent takes the press, JavaScript gets `onTouchCancel` instead of `onTouchEnd`.
    render: (onInnerPress) => <View onTouchEnd={onInnerPress} style={styles.square} />,
  },
  {
    name: 'text-link',
    // The center of this text is outside the link.
    render: (onInnerPress) => (
      <Text style={styles.linkText}>
        Text around a{' '}
        <Text onPress={onInnerPress} style={styles.link}>
          link
        </Text>
      </Text>
    ),
  },
  {
    name: 'hit-slop',
    // The center of this area is outside the small `Pressable`, inside its `hitSlop`.
    render: (onInnerPress) => (
      <View style={styles.hitSlopArea}>
        <Pressable
          onPress={onInnerPress}
          hitSlop={{ top: 16, bottom: 16, left: 0, right: 44 }}
          style={styles.smallSquare}
        />
      </View>
    ),
  },
  {
    name: 'pressable',
    render: (onInnerPress) => (
      <Pressable testID="pressable-target" onPress={onInnerPress} style={styles.square} />
    ),
  },
  {
    name: 'text-on-press',
    render: (onInnerPress) => (
      <Text testID="text-on-press-target" onPress={onInnerPress} style={styles.icon}>
        Tap
      </Text>
    ),
  },
  {
    name: 'switch',
    render: (onInnerPress) => <SwitchContent onChange={onInnerPress} />,
  },
  {
    name: 'text-input',
    render: () => <TextInput testID="text-input-target" placeholder="Type" style={styles.input} />,
  },
  {
    name: 'gh-rect-button',
    render: (onInnerPress) => (
      <RectButton testID="gh-rect-button-target" onPress={onInnerPress} style={styles.square} />
    ),
  },
  {
    name: 'gh-pressable',
    render: (onInnerPress) => (
      <GestureHandlerPressable
        testID="gh-pressable-target"
        onPress={onInnerPress}
        style={styles.square}
      />
    ),
  },
  {
    name: 'gh-tap',
    render: (onInnerPress) => <TapContent onTap={onInnerPress} />,
  },
];

function SwitchContent({ onChange }: { onChange: () => void }) {
  const [value, setValue] = React.useState(false);
  return (
    <Switch
      testID="switch-target"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange();
      }}
    />
  );
}

function TapContent({ onTap }: { onTap: () => void }) {
  const tap = useTapGesture({ runOnJS: true, onActivate: onTap });
  return (
    <GestureDetector gesture={tap}>
      <View testID="gh-tap-target" style={styles.square} />
    </GestureDetector>
  );
}

export function useCounts() {
  const [row, setRow] = React.useState(0);
  const [inner, setInner] = React.useState(0);
  return {
    row,
    inner,
    onRowPress: () => setRow((count) => count + 1),
    onInnerPress: () => setInner((count) => count + 1),
  };
}

// The same content in a React Native `Pressable` row, for comparison.
export function ReactNativeRow({ touchCase }: { touchCase: TouchCase }) {
  const { row, inner, onRowPress, onInnerPress } = useCounts();
  const name = `rn-${touchCase.name}`;
  return (
    <View>
      <Text testID={`${name}-counts`}>
        {name}: row {row}, inner {inner}
      </Text>
      <Pressable onPress={onRowPress} style={styles.reactNativeRow}>
        <Text>{`${name}  `}</Text>
        <View testID={`${name}-hosted`}>{touchCase.render(onInnerPress)}</View>
      </Pressable>
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    // Keeps the last rows above the tab bar.
    paddingBottom: 160,
    gap: 12,
  },
  section: {
    marginTop: 8,
    fontWeight: '600',
  },
  reactNativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
  },
  linkText: {
    width: 160,
  },
  link: {
    color: '#4a90e2',
  },
  square: {
    width: 48,
    height: 48,
    backgroundColor: 'gray',
  },
  hitSlopArea: {
    width: 60,
    height: 48,
    justifyContent: 'center',
  },
  smallSquare: {
    width: 12,
    height: 12,
    backgroundColor: 'gray',
  },
  icon: {
    fontSize: 28,
    paddingHorizontal: 12,
  },
  input: {
    width: 120,
    height: 48,
    borderWidth: 1,
    borderColor: 'gray',
  },
});
