import { Row, Switch as ComposeSwitch, Text } from '@expo/ui/jetpack-compose';
import {
  defaultMinSize,
  fillMaxWidth,
  IntrinsicSize,
  testID as testIDModifier,
  toggleable,
  weight,
  width,
} from '@expo/ui/jetpack-compose/modifiers';

import type { SwitchProps } from './types';

// Material's minimum touch target. A switch without its own handler drops this size, so a labeled
// switch gets it back here to keep the same layout.
const MIN_INTERACTIVE_SIZE = 48;

export function Switch({ value, onValueChange, label, disabled, testID, modifiers }: SwitchProps) {
  const isLabeled = label != null;
  const toggle = (
    <ComposeSwitch
      value={value}
      // A labeled row is the one toggleable node, so the switch gets no handler and merges into it.
      // Unlabeled, it keeps its handler even when disabled: `enabled` blocks input, and the handler
      // keeps its checked state and touch size in the accessibility tree.
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

  if (!isLabeled) return toggle;

  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{ spacedBy: 8 }}
      modifiers={[
        fillMaxWidth(),
        width(IntrinsicSize.Max),
        toggleable(value, () => !disabled && onValueChange(!value), {
          role: 'switch',
          enabled: !disabled,
        }),
      ]}>
      <Text modifiers={[weight(1)]}>{label}</Text>
      {toggle}
    </Row>
  );
}

export * from './types';
