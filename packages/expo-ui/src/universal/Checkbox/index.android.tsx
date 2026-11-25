import { Checkbox as ComposeCheckbox, Row, Text } from '@expo/ui/jetpack-compose';
import {
  defaultMinSize,
  testID as testIDModifier,
  toggleable,
} from '@expo/ui/jetpack-compose/modifiers';

import type { CheckboxProps } from './types';

// Material's minimum touch target.
const MIN_INTERACTIVE_SIZE = 48;

export function Checkbox({
  value,
  onValueChange,
  label,
  disabled,
  testID,
  modifiers,
}: CheckboxProps) {
  const isLabeled = label != null;
  const checkbox = (
    <ComposeCheckbox
      value={value}
      onCheckedChange={isLabeled ? undefined : onValueChange}
      enabled={!disabled}
      modifiers={[
        ...(modifiers ?? []),
        ...(isLabeled
          ? [defaultMinSize({ minWidth: MIN_INTERACTIVE_SIZE, minHeight: MIN_INTERACTIVE_SIZE })]
          : []),
        ...(testID ? [testIDModifier(testID)] : []),
      ]}
    />
  );

  if (!isLabeled) return checkbox;

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{ spacedBy: 8 }}
      modifiers={[
        toggleable(value, () => !disabled && onValueChange(!value), {
          role: 'checkbox',
          enabled: !disabled,
        }),
      ]}>
      {checkbox}
      <Text>{label}</Text>
    </Row>
  );
}

export * from './types';
