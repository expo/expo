import { Host, SyncToggle, Text, VStack, useNativeState } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  onHingeChange,
  padding,
  useHingeChange,
} from '@expo/ui/swift-ui/modifiers';
import type { Hinge, HingeContext } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function HingeChangeScreen() {
  const [hinge, setHinge] = useState<Hinge | null>(null);
  const [changes, setChanges] = useState<string[]>([]);
  const isFullyOpen = useNativeState(false);

  const handleHingeChange = (oldContext: HingeContext, newContext: HingeContext) => {
    setHinge(newContext.hinge);
    setChanges((previous) =>
      [`${describe(oldContext.hinge)} → ${describe(newContext.hinge)}`, ...previous].slice(0, 8)
    );
  };

  // Runs on the UI thread, with no JS-thread round-trip.
  const workletModifier = useHingeChange((_, newContext) => {
    'worklet';
    isFullyOpen.value = newContext.hinge?.status === 'fullyOpen';
  });

  return (
    <Host style={{ flex: 1 }}>
      <VStack
        alignment="leading"
        spacing={12}
        modifiers={[padding({ all: 20 }), onHingeChange(handleHingeChange), workletModifier]}>
        <Text modifiers={[font({ size: 48, weight: 'bold' })]}>
          {hinge ? `${hinge.angle.toFixed(0)}°` : 'No hinge'}
        </Text>
        <Text modifiers={[font({ size: 20 })]}>
          {hinge ? hinge.status : 'This device reports no hinge, or iOS is older than 27.1.'}
        </Text>
        <SyncToggle isOn={isFullyOpen} label="Fully open (set from a worklet)" />
        <Text modifiers={[font({ size: 14 }), foregroundStyle('#8e8e93')]}>
          Fold the device to see onHingeChange fire. Latest change first.
        </Text>
        {changes.map((change, index) => (
          <Text key={`${index}-${change}`} modifiers={[font({ size: 13, design: 'monospaced' })]}>
            {change}
          </Text>
        ))}
      </VStack>
    </Host>
  );
}

function describe(hinge: Hinge | null): string {
  return hinge ? `${hinge.status} ${hinge.angle.toFixed(1)}°` : 'null';
}

HingeChangeScreen.navigationOptions = {
  title: 'onHingeChange modifier',
};
