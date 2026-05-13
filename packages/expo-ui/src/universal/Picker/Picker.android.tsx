import { useEffect, useState } from 'react';

import { extractPickerItems } from './PickerItem';
import type { PickerItemValue, PickerProps } from './types';
import { useNativeState } from '../../State/useNativeState';
import { DropdownMenuItem } from '../../jetpack-compose/DropdownMenu/DropdownMenuItem';
import {
  ExposedDropdownMenuBox,
  ExposedDropdownMenu,
} from '../../jetpack-compose/ExposedDropdownMenuBox';
import { Text } from '../../jetpack-compose/Text';
import { TextField } from '../../jetpack-compose/TextField';
import { menuAnchor } from '../../jetpack-compose/modifiers';

/**
 * Android implementation of `Picker`.
 * Renders a Material 3 `ExposedDropdownMenuBox`.
 * `appearance` is accepted for API parity but ignored — Material 3 has no wheel-style picker.
 */
export function Picker<T extends PickerItemValue>({
  selectedValue,
  onValueChange,
  enabled = true,
  children,
}: PickerProps<T>) {
  const items = extractPickerItems<T>(children);
  const [expanded, setExpanded] = useState(false);

  const selectedLabel = items.find((item) => item.value === selectedValue)?.label ?? '';
  // `useNativeState` captures its initial value only once.
  // Push the current label every time it changes — otherwise the anchor `TextField` stays on the first-render label when `selectedValue` updates.
  const labelState = useNativeState(selectedLabel);
  useEffect(() => {
    labelState.value = selectedLabel;
  }, [selectedLabel, labelState]);

  return (
    <ExposedDropdownMenuBox
      expanded={expanded}
      onExpandedChange={enabled ? setExpanded : undefined}>
      <TextField value={labelState} readOnly enabled={enabled} modifiers={[menuAnchor()]} />
      <ExposedDropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
        {items.map((item) => (
          <DropdownMenuItem
            key={String(item.value)}
            onClick={
              enabled
                ? () => {
                    onValueChange(item.value);
                    setExpanded(false);
                  }
                : undefined
            }>
            <DropdownMenuItem.Text>
              <Text>{item.label}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
        ))}
      </ExposedDropdownMenu>
    </ExposedDropdownMenuBox>
  );
}

export * from './types';
