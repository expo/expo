import { Picker as SwiftUIPicker, Text } from '@expo/ui/swift-ui';
import {
  disabled as disabledModifier,
  pickerStyle,
  tag,
  type ModifierConfig,
} from '@expo/ui/swift-ui/modifiers';

import { extractPickerItems } from './PickerItem';
import type { PickerItemValue, PickerProps } from './types';

/**
 * iOS implementation of `Picker`.
 * Wraps SwiftUI's `Picker` and applies the matching `.pickerStyle` for the requested `appearance`.
 * Embed inside a parent `<Host>` (same as `Column` / `Row`).
 */
export function Picker<T extends PickerItemValue>({
  selectedValue,
  onValueChange,
  appearance = 'menu',
  enabled = true,
  children,
  testID,
}: PickerProps<T>) {
  const items = extractPickerItems<T>(children);
  const swiftUIStyle = appearance === 'wheel' ? 'wheel' : 'menu';
  const modifiers: ModifierConfig[] = [pickerStyle(swiftUIStyle)];
  if (!enabled) modifiers.push(disabledModifier(true));

  return (
    <SwiftUIPicker
      selection={selectedValue}
      onSelectionChange={(value) => onValueChange(value as T)}
      modifiers={modifiers}
      testID={testID}>
      {items.map((item) => (
        <Text key={String(item.value)} modifiers={[tag(item.value)]}>
          {item.label}
        </Text>
      ))}
    </SwiftUIPicker>
  );
}

export * from './types';
