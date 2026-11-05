import { requireNativeView } from 'expo';
import type { ComponentType } from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

import { useNativeStackSpike } from './native-stack-spike';

const Probe: ComponentType<
  ViewProps & {
    revision: number;
    onOwnershipChange: (event: NativeSyntheticEvent<Record<string, unknown>>) => void;
  }
> = requireNativeView('ExpoRouterSplitViewModule', 'SplitViewNativeStackView');

export default function NativeStackSpikeProbe() {
  const { integrated, revision, report } = useNativeStackSpike();
  return integrated ? (
    <Probe
      revision={revision}
      onOwnershipChange={(event) => report(event.nativeEvent)}
      pointerEvents="none"
      style={{ position: 'absolute', width: 0, height: 0 }}
    />
  ) : null;
}
