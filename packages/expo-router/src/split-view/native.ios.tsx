import { requireNativeView } from 'expo';
import type { ViewProps, ViewStyle } from 'react-native';

import type { SplitViewColumnOptionsViewProps } from './native.types';

const NativeSplitViewColumnOptionsView: React.ComponentType<
  ViewProps & SplitViewColumnOptionsViewProps
> = requireNativeView('ExpoRouterSplitViewModule', 'SplitViewColumnOptionsView');

const style: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: 1,
  height: 1,
  backgroundColor: 'transparent',
};

export function SplitViewColumnOptionsView(props: SplitViewColumnOptionsViewProps) {
  return <NativeSplitViewColumnOptionsView {...props} pointerEvents="none" style={style} />;
}
