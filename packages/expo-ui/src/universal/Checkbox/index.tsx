import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFocusVisible } from '../hooks';
import { colors, createWebComponent, durations, easings, shadows } from '../webUtils';
import type { CheckboxProps } from './types';

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
  },
  input: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    margin: 0,
    width: 0,
    height: 0,
  },
  pressable: {
    backgroundColor: colors.background,
    borderColor: colors.gray[300],
    borderRadius: 6,
    borderStyle: 'solid',
    borderWidth: 1.5,
    height: 18,
    outlineStyle: 'solid',
    outlineWidth: 0,
    transitionDuration: durations.fast,
    transitionProperty: 'all',
    transitionTimingFunction: easings.standard,
    width: 18,
  },
  hovered: {
    borderColor: colors.primary[500],
  },
  focused: {
    boxShadow: shadows.focus,
  },
  checked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  disabled: {
    cursor: 'auto',
    opacity: 0.5,
  },
  text: {
    color: colors.foreground,
    lineHeight: 20,
    userSelect: 'none',
  },
});

/**
 * A toggle control that represents a checked or unchecked state.
 */
export function Checkbox({ value, onValueChange, label, disabled = false, testID }: CheckboxProps) {
  const { focusVisible, onFocus, onBlur } = useFocusVisible();

  return (
    <View
      aria-disabled={disabled}
      role="label"
      style={[styles.view, disabled && styles.viewDisabled]}>
      <Input
        type="checkbox"
        focusable
        onFocus={onFocus}
        onBlur={onBlur}
        checked={value}
        onChange={({ target: { checked } }) => onValueChange(checked)}
        disabled={disabled}
        data-testid={testID}
        style={styles.input}
      />

      <Pressable
        tabIndex={-1}
        style={({ hovered }) => [
          styles.pressable,
          hovered && !disabled && styles.hovered,
          value && styles.checked,
          focusVisible && styles.focused,
          disabled && styles.disabled,
        ]}>
        {value && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="none"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round">
            <polyline points="3 8.5 6.5 12 13 4.5" />
          </svg>
        )}
      </Pressable>
      {label != null && <Text style={styles.text}>{label}</Text>}
    </View>
  );
}

export * from './types';
