import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

import type { ExtractedPickerItem, PickerItemProps, PickerItemValue } from './types';

/**
 * Data-only option marker for [`Picker`](#picker).
 * Used via the compound API: `<Picker.Item label="…" value={…} />`.
 */
export function PickerItem<T extends PickerItemValue>(_props: PickerItemProps<T>): null {
  return null;
}

// Walk `<Picker>` children and extract each `<Picker.Item>`'s props.
// Non-`PickerItem` children are ignored.
export function extractPickerItems<T extends PickerItemValue>(
  children: ReactNode
): ExtractedPickerItem<T>[] {
  return Children.toArray(children)
    .filter(
      (child): child is ReactElement<PickerItemProps<T>> =>
        isValidElement(child) && child.type === PickerItem
    )
    .map((child) => ({
      label: child.props.label,
      value: child.props.value,
    }));
}
