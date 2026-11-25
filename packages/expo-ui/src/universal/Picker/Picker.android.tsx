import { useEffect, useRef, useState } from 'react';

import {
  SelectableDropdownMenuItem,
  type SelectableDropdownMenuItemColors,
} from '../../jetpack-compose/DropdownMenu';
import {
  ExposedDropdownMenuBox,
  ExposedDropdownMenu,
} from '../../jetpack-compose/ExposedDropdownMenuBox';
import { Icon } from '../../jetpack-compose/Icon';
import { Text } from '../../jetpack-compose/Text';
import { TextField, type TextFieldRef } from '../../jetpack-compose/TextField';
import { menuAnchor, onVisibilityChanged, semantics } from '../../jetpack-compose/modifiers';
import { extractPickerItems } from './PickerItem';
import type { PickerItemValue, PickerProps } from './types';

const CHECK_ICON = require('../../../assets/check.xml');

// Compose's `MenuDefaults.LeadingIconSize`.
const MENU_ITEM_ICON_SIZE = 20;

// `SelectableDropdownMenuItem` fills an unselected item with its own container color, which is
// not the color of `ExposedDropdownMenu`. A transparent container keeps the menu's color.
const ITEM_COLORS: SelectableDropdownMenuItemColors = { containerColor: 'transparent' };

/**
 * Android implementation of `Picker`.
 * Renders a Material 3 `ExposedDropdownMenuBox`.
 * `appearance` is accepted for API parity but ignored — Material 3 has no wheel-style picker.
 */
export function Picker<T extends PickerItemValue>({
  selectedValue,
  onValueChange,
  enabled = true,
  accessibilityLabel,
  children,
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
      onExpandedChange={enabled ? setExpanded : undefined}>
      <TextField
        ref={textFieldRef}
        readOnly
        enabled={enabled}
        modifiers={[
          menuAnchor(),
          onVisibilityChanged((visible) => setIsVisible(visible)),
          ...(accessibilityLabel !== undefined
            ? [semantics({ contentDescription: accessibilityLabel })]
            : []),
        ]}
      />
      <ExposedDropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
        {items.map((item) => (
          <SelectableDropdownMenuItem
            key={String(item.value)}
            selected={item.value === selectedValue}
            colors={ITEM_COLORS}
            onClick={
              enabled
                ? () => {
                    onValueChange(item.value);
                    setExpanded(false);
                  }
                : undefined
            }>
            <SelectableDropdownMenuItem.Text>
              <Text>{item.label}</Text>
            </SelectableDropdownMenuItem.Text>
            <SelectableDropdownMenuItem.SelectedLeadingIcon>
              <Icon source={CHECK_ICON} size={MENU_ITEM_ICON_SIZE} />
            </SelectableDropdownMenuItem.SelectedLeadingIcon>
          </SelectableDropdownMenuItem>
        ))}
      </ExposedDropdownMenu>
    </ExposedDropdownMenuBox>
  );
}

export * from './types';
