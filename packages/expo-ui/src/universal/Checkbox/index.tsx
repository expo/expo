import type { ComponentProps } from 'react';
import {
  StyleSheet,
  Text,
  unstable_createElement,
  useColorScheme,
  View,
  type ViewProps,
} from 'react-native';

import type { CheckboxProps } from './types';

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'auto',
  },
  cursorInherit: {
    // @ts-expect-error
    cursor: 'inherit',
  },
  darkText: {
    color: '#fff',
  },
});

const NativeCheckbox = (
  props: Omit<ComponentProps<'input'>, 'style' | 'type'> & { style?: ViewProps['style'] }
) => unstable_createElement('input', { ...props, type: 'checkbox' });

/**
 * A toggle control that represents a checked or unchecked state.
 */
export function Checkbox({ value, onValueChange, label, disabled = false, testID }: CheckboxProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View role="label" aria-disabled={disabled} style={[styles.label, disabled && styles.disabled]}>
      <NativeCheckbox
        checked={value}
        onChange={(e) => onValueChange(e.target.checked)}
        disabled={disabled}
        data-testid={testID}
        style={styles.cursorInherit}
      />
      {label != null && <Text style={isDark && styles.darkText}>{label}</Text>}
    </View>
  );
}

export * from './types';
