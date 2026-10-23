import { requireNativeView } from 'expo';
import type { ViewProps } from 'react-native';

import type { SplitViewColumnOptionsViewProps } from './native.types';

const NativeSplitViewColumnOptionsView: React.ComponentType<
  ViewProps & SplitViewColumnOptionsViewProps & { strategy?: string }
> = requireNativeView('ExpoRouterSplitViewModule', 'SplitViewColumnOptionsView');

export function SplitViewColumnOptionsView(props: SplitViewColumnOptionsViewProps) {
  return (
    <NativeSplitViewColumnOptionsView
      {...props}
      // Spike only: lets router-tester switch between the native write strategies.
      strategy={(globalThis as { __splitHeaderSpikeStrategy?: string }).__splitHeaderSpikeStrategy}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        backgroundColor: 'transparent',
      }}
    />
  );
}
