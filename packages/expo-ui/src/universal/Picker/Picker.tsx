import type { ComponentProps } from 'react';
import { extractPickerItems } from './PickerItem';
import type { PickerItemValue, PickerProps } from './types';
import { StyleSheet, unstable_createElement, type ViewProps } from 'react-native';

const Select = (props: Omit<ComponentProps<'select'>, 'style'> & { style?: ViewProps['style'] }) =>
  unstable_createElement('select', props);

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

  return (
    <Select
      disabled={!enabled}
      value={String(selectedValue)}
      onChange={(e) => {
        const index = e.target.selectedIndex;
        const item = items[index];
        if (item) onValueChange(item.value);
      }}
      style={styles.select}
      data-testid={testID}>
      {items.map((item) => (
        <option key={String(item.value)} value={String(item.value)}>
          {item.label}
        </option>
      ))}
    </Select>
  );
}

const styles = StyleSheet.create({
  select: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: 14,
    margin: 0,
  },
});

export * from './types';
