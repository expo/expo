import { useEffect, useRef, useState } from 'react';

import { extractPickerItems } from './PickerItem';
import type { PickerItemValue, PickerProps } from './types';
import { DropdownMenuItem } from '../../jetpack-compose/DropdownMenu/DropdownMenuItem';
import {
  ExposedDropdownMenuBox,
  ExposedDropdownMenu,
} from '../../jetpack-compose/ExposedDropdownMenuBox';
import { Text } from '../../jetpack-compose/Text';
import { TextField, type TextFieldRef } from '../../jetpack-compose/TextField';
import { menuAnchor, onVisibilityChanged } from '../../jetpack-compose/modifiers';

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
  ref,
}: PickerProps<T>) {
  const items = extractPickerItems<T>(children);
  const [expanded, setExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const textFieldRef = useRef<TextFieldRef>(null);

  const selectedLabel = items.find((item) => item.value === selectedValue)?.label ?? '';
  // The anchor `TextField` is uncontrolled — push the current label imperatively once the view is on screen.
  useEffect(() => {
    if (!isVisible) return;
    textFieldRef.current?.setText(selectedLabel);
  }, [selectedLabel, isVisible]);

  return (
    <ExposedDropdownMenuBox
      expanded={expanded}
      onExpandedChange={enabled ? setExpanded : undefined}
      {...{ ref }}>
      <TextField
        ref={textFieldRef}
        readOnly
        enabled={enabled}
        modifiers={[menuAnchor(), onVisibilityChanged((visible) => setIsVisible(visible))]}
      />
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
