import { Row, Switch as ComposeSwitch, Text } from '@expo/ui/jetpack-compose';
import { testID as testIDModifier } from '@expo/ui/jetpack-compose/modifiers';

import { EnsureHost, intrinsicHostOptions } from '../autoHost';
import type { SwitchProps } from './types';

export function Switch({ value, onValueChange, label, disabled, testID, modifiers }: SwitchProps) {
  const toggle = (
    <ComposeSwitch
      value={value}
      onCheckedChange={disabled ? undefined : onValueChange}
      enabled={!disabled}
      modifiers={[...(modifiers ?? []), ...(testID ? [testIDModifier(testID)] : [])]}
    />
  );

  const content =
    label == null ? (
      toggle
    ) : (
      <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 8 }}>
        <Text>{label}</Text>
        {toggle}
      </Row>
    );

  return <EnsureHost {...intrinsicHostOptions}>{content}</EnsureHost>;
}

export * from './types';
