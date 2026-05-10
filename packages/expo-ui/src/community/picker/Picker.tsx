import * as React from 'react';

import {
  extractPickerItems,
  PickerItem,
  type PickerItemProps,
  type PickerItemValue,
  type PickerProps,
} from './types';

/**
 * A drop-in replacement for `@react-native-picker/picker` on web.
 * Renders a native `<select>` element.
 */
export function Picker<T extends PickerItemValue>(props: PickerProps<T>) {
  const { selectedValue, onValueChange, enabled, style, children, ref } = props;
  const items = extractPickerItems<T>(children);
  const selectRef = React.useRef<HTMLSelectElement>(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => selectRef.current?.focus(),
    blur: () => selectRef.current?.blur(),
  }));

  return (
    <select
      ref={selectRef}
      disabled={enabled === false}
      value={selectedValue == null ? undefined : String(selectedValue)}
      onChange={(e) => {
        const index = e.target.selectedIndex;
        const item = items[index];
        if (item && onValueChange) {
          onValueChange(item.value, index);
        }
      }}
      style={style as React.CSSProperties}>
      {items.map((item, index) => (
        <option
          key={String(item.value ?? index)}
          value={String(item.value)}
          disabled={item.enabled === false}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

Picker.Item = PickerItem as React.ComponentType<PickerItemProps>;
