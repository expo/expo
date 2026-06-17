import { Checkbox as ComposeCheckbox, Row, Text } from '@expo/ui/jetpack-compose';
import { clickable, testID as testIDModifier } from '@expo/ui/jetpack-compose/modifiers';

import type { CheckboxProps } from './types';

export function Checkbox({
  value,
  onValueChange,
  label,
  disabled,
  testID,
  modifiers,
  ref,
}: CheckboxProps) {
  const checkbox = (
    <ComposeCheckbox
      value={value}
      onCheckedChange={disabled ? undefined : onValueChange}
      enabled={!disabled}
      modifiers={[...(modifiers ?? []), ...(testID ? [testIDModifier(testID)] : [])]}
      {...{ ref }}
    />
  );

  if (label == null) return checkbox;

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{ spacedBy: 8 }}
      modifiers={[clickable(() => !disabled && onValueChange(!value))]}>
      {checkbox}
      <Text>{label}</Text>
    </Row>
  );
}

export * from './types';
