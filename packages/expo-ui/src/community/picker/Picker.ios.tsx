import * as React from 'react';

import {
  extractPickerItems,
  PickerItem,
  type PickerWithItems,
  type PickerItemValue,
  type PickerProps,
} from './types';
import { Host } from '../../swift-ui/Host';
import { Picker as SwiftUIPicker } from '../../swift-ui/Picker';
import { Text } from '../../swift-ui/Text';
import {
  disabled as disabledModifier,
  fixedSize,
  foregroundStyle,
  font,
} from '../../swift-ui/modifiers';
import { pickerStyle } from '../../swift-ui/modifiers/pickerStyle';
import { tag } from '../../swift-ui/modifiers/tag';
import { type ModifierConfig } from '../../types';

/**
 * A drop-in replacement for `@react-native-picker/picker` on iOS.
 * Renders a SwiftUI wheel picker wrapped in a Host.
 */
function PickerImpl<T extends PickerItemValue>(props: PickerProps<T>) {
  const { selectedValue, onValueChange, enabled, style, children, ref } = props;
  const items = extractPickerItems<T>(children);
  const modifiers = [
    pickerStyle('wheel'),
    fixedSize(),
    ...(enabled === false ? [disabledModifier(true)] : []),
  ];

  // focus/blur are no-ops on iOS (wheel picker is always visible)
  React.useImperativeHandle(ref, () => ({
    focus: () => {},
    blur: () => {},
  }));

  return (
    <Host matchContents={{ vertical: true }} style={style}>
      <SwiftUIPicker
        modifiers={modifiers}
        selection={selectedValue}
        onSelectionChange={(newValue) => {
          if (onValueChange) {
            const index = items.findIndex((item) => item.value === newValue);
            onValueChange(newValue as T, index);
          }
        }}>
        {items.map((item, index) => {
          const itemModifiers: ModifierConfig[] = [tag(String(item.value))];
          if (item.color) {
            itemModifiers.push(foregroundStyle(item.color));
          }
          if (item.fontFamily) {
            itemModifiers.push(font({ family: item.fontFamily }));
          }
          return (
            <Text key={String(item.value ?? index)} modifiers={itemModifiers}>
              {item.label}
            </Text>
          );
        })}
      </SwiftUIPicker>
    </Host>
  );
}

PickerImpl.displayName = 'Picker';
export const Picker: PickerWithItems = Object.assign(PickerImpl, { Item: PickerItem });
