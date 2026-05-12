import * as React from 'react';

import {
  extractPickerItems,
  PickerItem,
  type PickerItemProps,
  type PickerItemValue,
  type PickerProps,
} from './types';
import { useNativeState } from '../../State/useNativeState';
import { DropdownMenuItem } from '../../jetpack-compose/DropdownMenu/DropdownMenuItem';
import {
  ExposedDropdownMenuBox,
  ExposedDropdownMenu,
} from '../../jetpack-compose/ExposedDropdownMenuBox';
import { Host } from '../../jetpack-compose/Host';
import { Text } from '../../jetpack-compose/Text';
import { TextField } from '../../jetpack-compose/TextField';
import { menuAnchor } from '../../jetpack-compose/modifiers';

/**
 * A drop-in replacement for `@react-native-picker/picker` on Android.
 * Renders a Material 3 `ExposedDropdownMenuBox` wrapped in a Host.
 */
export function Picker<T extends PickerItemValue>(props: PickerProps<T>) {
  const { selectedValue, onValueChange, enabled, style, children, ref } = props;
  const items = extractPickerItems<T>(children);
  const [expanded, setExpanded] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    focus: () => setExpanded(true),
    blur: () => setExpanded(false),
  }));

  const selectedItem = items.find((item) => item.value === selectedValue);
  const selectedLabel = selectedItem?.label ?? '';
  const labelState = useNativeState(selectedLabel);

  return (
    <Host style={style} matchContents={{ vertical: true }}>
      <ExposedDropdownMenuBox
        expanded={expanded}
        onExpandedChange={enabled === false ? undefined : setExpanded}>
        <TextField value={labelState} readOnly enabled={enabled} modifiers={[menuAnchor()]} />
        <ExposedDropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
          {items.map((item, index) => (
            <DropdownMenuItem
              key={String(item.value ?? index)}
              enabled={item.enabled}
              onClick={() => {
                onValueChange?.(item.value, index);
                setExpanded(false);
              }}>
              <DropdownMenuItem.Text>
                <Text
                  color={item.color}
                  style={{
                    fontFamily: item.fontFamily,
                    fontSize: item.fontSize,
                    background: item.backgroundColor,
                  }}>
                  {item.label}
                </Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </ExposedDropdownMenu>
      </ExposedDropdownMenuBox>
    </Host>
  );
}

Picker.Item = PickerItem as React.ComponentType<PickerItemProps>;
