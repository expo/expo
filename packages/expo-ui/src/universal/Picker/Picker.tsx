import { StyleSheet, View } from 'react-native';

import { colors, createWebComponent, durations, easings, shadows } from '../webUtils';
import { extractPickerItems } from './PickerItem';
import type { PickerItemValue, PickerProps } from './types';
import { useFocusVisible } from '../hooks';

const Select = createWebComponent('select');
const Svg = createWebComponent('svg');

const styles = StyleSheet.create({
  select: {
    appearance: 'none',
    backgroundColor: colors.background,
    borderColor: colors.gray[200],
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: shadows.input,
    boxSizing: 'border-box',
    color: colors.gray[900],
    cursor: 'pointer',
    display: 'flex',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: 14,
    height: 40,
    outlineStyle: 'solid',
    outlineWidth: 0,
    paddingLeft: 12,
    paddingRight: 36,
    paddingVertical: 0,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: durations.fast,
    transitionTimingFunction: easings.standard,
  },
  focused: {
    borderColor: colors.primary[500],
    boxShadow: shadows.focus,
  },
  arrow: {
    height: 5,
    width: 9,
    pointerEvents: 'none',
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
  },
});

/**
 * A single-selection input.
 * Declare options via `<Picker.Item label value />` children.
 */
export function Picker<T extends PickerItemValue>({
  selectedValue,
  onValueChange,
  enabled = true,
  children,
  testID,
}: PickerProps<T>) {
  const items = extractPickerItems<T>(children);
  const { focusVisible, onFocus, onBlur } = useFocusVisible();

  return (
    <View>
      <Select
        disabled={!enabled}
        value={String(selectedValue)}
        onFocus={onFocus}
        onBlur={onBlur}
        testID={testID}
        onChange={(e) => {
          const index = e.target.selectedIndex;
          const item = items[index];
          if (item) onValueChange(item.value);
        }}
        style={[styles.select, focusVisible && styles.focused]}>
        {items.map((item) => (
          <option key={String(item.value)} value={String(item.value)}>
            {item.label}
          </option>
        ))}
      </Select>

      <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 8" style={styles.arrow}>
        <path
          d="M12.293.293a1 1 0 1 1 1.414 1.414l-6 6a1 1 0 0 1-1.414 0l-6-6A1 1 0 1 1 1.707.293L7 5.586z"
          fill={colors.gray[500]}
        />
      </Svg>
    </View>
  );
}

export * from './types';
