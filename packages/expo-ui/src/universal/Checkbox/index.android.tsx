import { Checkbox as ComposeCheckbox, Row, Text } from '@expo/ui/jetpack-compose';
import { clickable, testID as testIDModifier } from '@expo/ui/jetpack-compose/modifiers';

import { EnsureHost, intrinsicHostOptions } from '../autoHost';
import type { CheckboxProps } from './types';

export function Checkbox({
  value,
  onValueChange,
  label,
  disabled,
  testID,
  modifiers,
}: CheckboxProps) {
  const checkbox = (
    <ComposeCheckbox
      value={value}
      onCheckedChange={disabled ? undefined : onValueChange}
      enabled={!disabled}
      modifiers={[...(modifiers ?? []), ...(testID ? [testIDModifier(testID)] : [])]}
    />
  );

  const content =
    label == null ? (
      checkbox
    ) : (
      <Row
        verticalAlignment="center"
        horizontalArrangement={{ spacedBy: 8 }}
        modifiers={[clickable(() => !disabled && onValueChange(!value))]}>
        {checkbox}
        <Text>{label}</Text>
      </Row>
    );

  return <EnsureHost {...intrinsicHostOptions}>{content}</EnsureHost>;
}

export * from './types';
