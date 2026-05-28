import { View, Text, StyleSheet } from 'react-native';

import type { SwitchProps } from './types';
import { useFocusVisible } from '../hooks';
import { colors, createWebComponent, durations, easings, shadows } from '../webUtils';

const Input = createWebComponent('input');

const styles = StyleSheet.create({
  view: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'inline-flex',
    flexDirection: 'row',
    gap: 10,
  },
  viewDisabled: {
    cursor: 'auto',
    opacity: 0.5,
  },
  input: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    margin: 0,
    width: 0,
    height: 0,
  },
  text: {
    color: colors.foreground,
    userSelect: 'none',
  },
  track: {
    backgroundColor: colors.gray[300],
    borderRadius: 22 / 2,
    height: 22,
    position: 'relative',
    transitionDuration: durations.base,
    transitionProperty: 'background-color',
    transitionTimingFunction: easings.standard,
    width: 36,
  },
  trackChecked: {
    backgroundColor: colors.primary[500],
  },
  focused: {
    boxShadow: shadows.focus,
  },
  thumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#fff',
    borderRadius: 18 / 2,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
    height: 18,
    width: 18,
    transitionDuration: durations.base,
    transitionProperty: 'transform',
    transitionTimingFunction: easings.standard,
  },
  thumbChecked: {
    transform: 'translateX(14px)',
  },
});

/**
 * A toggle control that switches between on and off states.
 */
export function Switch({ value, onValueChange, label, disabled = false, testID }: SwitchProps) {
  const { focusVisible, onFocus, onBlur } = useFocusVisible();

  return (
    <View
      aria-disabled={disabled}
      role="label"
      style={[styles.view, disabled && styles.viewDisabled]}>
      <Input
        type="checkbox"
        role="switch"
        onFocus={onFocus}
        onBlur={onBlur}
        checked={value}
        disabled={disabled}
        testID={testID}
        style={styles.input}
        onChange={({ target: { checked } }) => onValueChange(checked)}
      />

      {label != null && <Text style={styles.text}>{label}</Text>}

      <View style={[styles.track, value && styles.trackChecked, focusVisible && styles.focused]}>
        <View style={[styles.thumb, value && styles.thumbChecked]} />
      </View>
    </View>
  );
}

export * from './types';
