import * as React from 'react';

import { extractPickerItems, PickerItem, type PickerProps } from './types';
import { Host } from '../jetpack-compose/Host';
import { SegmentedButton } from '../jetpack-compose/SegmentedButton';
import { SingleChoiceSegmentedButtonRow } from '../jetpack-compose/SingleChoiceSegmentedButtonRow';
import { Text } from '../jetpack-compose/Text';

/**
 * A drop-in replacement for `@react-native-picker/picker` on Android.
 * Renders a Material 3 `SingleChoiceSegmentedButtonRow` wrapped in a Host.
 */
function PickerComponent(props: PickerProps) {
  const { selectedValue, onValueChange, enabled, style, children } = props;
  const items = extractPickerItems(children);

  return (
    <Host style={style} matchContents={{ vertical: true }}>
      <SingleChoiceSegmentedButtonRow>
        {items.map((item, index) => (
          <SegmentedButton
            key={String(item.value ?? index)}
            selected={item.value === selectedValue}
            enabled={item.enabled !== undefined ? item.enabled : enabled}
            onClick={() => {
              onValueChange?.(item.value, index);
            }}>
            <SegmentedButton.Label>
              <Text>{item.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Host>
  );
}

export const Picker: typeof PickerComponent & { Item: typeof PickerItem } = Object.assign(
  PickerComponent,
  { Item: PickerItem }
);
