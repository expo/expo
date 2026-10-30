import { requireNativeView } from 'expo';
import type { ViewProps } from 'react-native';

import type { SplitViewNativeHeaderProps } from './native.types';

const SplitViewHeaderView: React.ComponentType<ViewProps & SplitViewNativeHeaderProps> =
  requireNativeView('ExpoRouterSplitViewModule', 'SplitViewHeaderView');

export function SplitViewNativeHeader(props: SplitViewNativeHeaderProps) {
  return (
    <SplitViewHeaderView
      {...props}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}
    />
  );
}
