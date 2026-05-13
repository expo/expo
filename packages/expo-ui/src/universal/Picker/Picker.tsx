import { extractPickerItems } from './PickerItem';
import type { PickerItemValue, PickerProps } from './types';

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
    <select
      disabled={!enabled}
      value={String(selectedValue)}
      onChange={(e) => {
        const index = e.target.selectedIndex;
        const item = items[index];
        if (item) onValueChange(item.value);
      }}
      data-testid={testID}>
      {items.map((item) => (
        <option key={String(item.value)} value={String(item.value)}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

export * from './types';
